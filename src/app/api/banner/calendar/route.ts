import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/storage';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * API para upload de banner do calendário
 * Implementa o padrão de proxy para evitar problemas de CORS e URLs do MinIO
 * Salva as informações no banco de dados para persistência
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[Calendar Banner API] Processando upload de banner');
    
    const formData = await req.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const filename = `banners/calendario/banner-principal-${timestamp}.${ext}`;
    
    // Converter para buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload para o MinIO
    storageService.setPrefix('');
    await storageService.uploadFile(buffer, {
      filename: filename,
      contentType: file.type,
      size: buffer.length
    });
    
    // URL usando o padrão de proxy (não aponta diretamente para o MinIO)
    const bannerUrl = `/api/banner/calendar/image?path=${encodeURIComponent(filename)}&t=${timestamp}`;
    
    console.log('[Calendar Banner API] Upload concluído com sucesso:', { bannerUrl });
    
    // Salvar informações no banco de dados
    try {
      // Verificar se existe algum evento para associar o banner
      const eventCount = await prisma.$queryRaw<[{count: BigInt}]>`
        SELECT COUNT(*) as count FROM "CalendarEvent"
      `;
      
      const count = Number(eventCount[0].count);
      console.log('[Calendar Banner API] Eventos encontrados:', count);
      
      if (count > 0) {
        // Se existe um evento, atualizar o mais recente
        console.log('[Calendar Banner API] Atualizando evento existente');
        await prisma.$executeRaw`
          UPDATE "CalendarEvent"
          SET 
            "bannerUrl" = ${bannerUrl},
            "bannerFilename" = ${filename},
            "bannerTimestamp" = ${timestamp}
          WHERE "id" = (
            SELECT "id" FROM "CalendarEvent" 
            ORDER BY "updatedat" DESC 
            LIMIT 1
          )
        `;
      } else {
        // Se não existir nenhum evento, criar um registro específico para o banner
        console.log('[Calendar Banner API] Criando registro específico para o banner');
        await prisma.calendarEvent.create({
          data: {
            title: 'Banner Principal',
            description: 'Banner principal do calendário',
            startdate: new Date(),  // Campo obrigatório
            enddate: new Date(),     // Campo obrigatório
            modality: 'Banner',      // Campo obrigatório
            category: 'Banner',      // Campo obrigatório
            city: 'Goiânia',        // Campo obrigatório
            uf: 'GO',                // Campo obrigatório
            status: 'ativo',         // Campo obrigatório
            bannerUrl: bannerUrl,
            bannerFilename: filename,
            bannerTimestamp: timestamp
          }
        });
      }
      
      console.log('[Calendar Banner API] Banner salvo no banco de dados');
    } catch (dbError) {
      console.error('[Calendar Banner API] Erro ao salvar no banco de dados:', dbError);
      // Continuar mesmo com erro no banco de dados - o upload no MinIO foi bem-sucedido
    }
    
    return NextResponse.json({ 
      bannerUrl,
      storedFilename: filename,
      message: 'Banner enviado e salvo com sucesso'
    });
    
  } catch (err) {
    console.error('[Calendar Banner API] Erro:', err);
    return NextResponse.json({ error: 'Erro ao processar o banner' }, { status: 500 });
  }
}

/**
 * API para buscar o banner do calendário
 * Prioriza buscar do banco de dados e usa fallback para MinIO ou imagem padrão
 */
export async function GET() {
  try {
    console.log('[Calendar Banner API] Buscando banner');
    const placeholderUrl = '/images/calendar-banner-placeholder.jpg';
    
    // 1. Tentar buscar do banco de dados primeiro
    try {
      console.log('[Calendar Banner API] Tentando buscar do banco de dados');
      
      // Usar SQL direto para evitar problemas de tipagem com o Prisma
      const bannerFromDb = await prisma.$queryRaw`
        SELECT "bannerUrl", "bannerFilename", "bannerTimestamp"
        FROM "CalendarEvent"
        WHERE "bannerUrl" IS NOT NULL AND "bannerFilename" IS NOT NULL
        ORDER BY "bannerTimestamp" DESC
        LIMIT 1
      `;
      
      // Se encontrou banner no banco de dados
      if (bannerFromDb && Array.isArray(bannerFromDb) && bannerFromDb.length > 0) {
        const banner = bannerFromDb[0] as { bannerUrl: string, bannerFilename: string };
        
        if (banner.bannerUrl && banner.bannerFilename) {
          console.log('[Calendar Banner API] Banner encontrado no banco de dados:', banner);
          
          // Adicionar timestamp para evitar cache
          const timestamp = Date.now();
          const bannerUrl = banner.bannerUrl.includes('?') 
            ? `${banner.bannerUrl}&t=${timestamp}`
            : `${banner.bannerUrl}?t=${timestamp}`;
          
          return NextResponse.json({
            bannerUrl,
            storedFilename: banner.bannerFilename,
            message: 'Banner recuperado do banco de dados'
          });
        }
      }
      
      console.log('[Calendar Banner API] Banner não encontrado no banco de dados');
    } catch (dbError) {
      console.error('[Calendar Banner API] Erro ao buscar do banco de dados:', dbError);
      // Continuar para a próxima estratégia de busca
    }
    
    // 2. Tentar buscar diretamente do MinIO como fallback
    try {
      console.log('[Calendar Banner API] Tentando buscar do MinIO');
      
      // Listar arquivos no MinIO com timeout para evitar bloqueio
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao listar arquivos')), 3000);
      });
      
      const filesPromise = storageService.listFiles('banners/calendario/');
      
      // Race entre o timeout e a busca de arquivos
      const existingFiles = await Promise.race([filesPromise, timeoutPromise]) as string[];
      
      // Encontrar os banners do calendário
      const bannerFiles = existingFiles.filter(f => f.includes('banner-principal-'));
      
      if (bannerFiles.length > 0) {
        // Ordenar por timestamp decrescente para pegar o mais recente
        bannerFiles.sort((a, b) => {
          const matchA = a.match(/banner-principal-(\d+)/);
          const matchB = b.match(/banner-principal-(\d+)/);
          
          const timestampA = matchA ? parseInt(matchA[1]) : 0;
          const timestampB = matchB ? parseInt(matchB[1]) : 0;
          
          return timestampB - timestampA;
        });
        
        // Pegar o banner mais recente
        const filename = bannerFiles[0];
        const timestamp = Date.now();
        
        console.log('[Calendar Banner API] Banner encontrado no MinIO:', { filename });
        
        // Gerar URL proxy
        const bannerUrl = `/api/banner/calendar/image?path=${encodeURIComponent(filename)}&t=${timestamp}`;
        
        // Atualizar o banco de dados com essa informação (para futuras consultas)
        try {
          await prisma.$executeRaw`
            UPDATE "CalendarEvent"
            SET 
              "bannerUrl" = ${bannerUrl},
              "bannerFilename" = ${filename},
              "bannerTimestamp" = ${new Date(timestamp)}
            WHERE "id" = (
              SELECT "id" FROM "CalendarEvent" 
              ORDER BY "updatedat" DESC 
              LIMIT 1
            )
          `;
          console.log('[Calendar Banner API] Banner do MinIO salvo no banco de dados');
        } catch (updateError) {
          console.error('[Calendar Banner API] Erro ao atualizar banco de dados:', updateError);
          // Continuar mesmo com erro - ainda podemos retornar a URL
        }
        
        return NextResponse.json({
          bannerUrl,
          storedFilename: filename,
          message: 'Banner recuperado do MinIO'
        });
      }
    } catch (minioError) {
      console.error('[Calendar Banner API] Erro ao buscar do MinIO:', minioError);
      // Continuar para o fallback final
    }
    
    // 3. Fallback para imagem padrão
    console.log('[Calendar Banner API] Usando banner padrão');
    
    return NextResponse.json({
      bannerUrl: placeholderUrl,
      storedFilename: null,
      message: 'Usando banner padrão'
    });
    
  } catch (err) {
    console.error('[Calendar Banner API] Erro geral:', err);
    return NextResponse.json({
      bannerUrl: '/images/calendar-banner-placeholder.jpg',
      error: 'Erro ao buscar banner'
    }, { status: 500 });
  }
}
