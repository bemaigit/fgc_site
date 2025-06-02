import { storageService } from '@/lib/storage'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { generateUserImagePath, generateUserImageProxyUrl } from '@/lib/userImageHelper'
import { generateNewsImagePath, processNewsImageUrl } from '@/lib/processNewsImageUrl'
import { processAthleteGalleryUrl } from '@/lib/processAthleteGalleryUrl'

export async function POST(req: NextRequest) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new Response('Não autorizado', { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) {
      return new Response('Nenhum arquivo enviado', { status: 400 })
    }

    // Valida tipo de arquivo
    const type = formData.get('type') as string
    const allowedTypes = type === 'regulation' 
      ? ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      : type === 'results'
        ? ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv']
        : ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return new Response('Tipo de arquivo não permitido', { status: 400 })
    }

    // Valida tamanho (max 10MB para documentos, 2MB para imagens)
    const maxSize = type === 'regulation' || type === 'results' ? 10 * 1024 * 1024 : 2 * 1024 * 1024
    if (file.size > maxSize) {
      return new Response('Arquivo muito grande', { status: 400 })
    }

    // Obter prefixo personalizado, se fornecido
    const customPrefix = formData.get('prefix') as string | null;
    
    // Obter pasta personalizada para upload (usado para o banner de atletas)
    const folder = formData.get('folder') as string | null;

    // Gera nome único e caminho de armazenamento
    let fileName: string;
    
    // Tratamento especial para imagens de perfil
    if (type === 'profile') {
      // Usar função auxiliar para gerar caminho de imagem de perfil
      // A função generateUserImagePath já retorna o caminho completo
      fileName = generateUserImagePath(file.name);
      console.log('Caminho gerado para imagem de perfil:', { originalName: file.name, fileName });
    }
    // Tratamento especial para imagens de notícias
    else if (type === 'news') {
      // Usar função auxiliar para gerar caminho de imagem de notícia
      fileName = generateNewsImagePath(file.name);
      console.log('Caminho gerado para notícia:', { originalName: file.name, fileName });
    } 
    // Tratamento especial para galeria de atletas
    else if (type === 'athlete-gallery') {
      // Gera um nome de arquivo único com prefixo 'athlete-' (sempre minúsculo)
      const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
      // Garante que usamos sempre letras minúsculas no nome do arquivo
      const uniqueName = `athlete-${Date.now()}-${Math.random().toString(36).slice(2, 10).toLowerCase()}.${ext}`;
      
      // Define o caminho no formato 'athlete-gallery/nome-unico.extensao'
      // Garante que não há duplicação de 'athlete-gallery/'
      fileName = `athlete-gallery/${uniqueName}`.replace(/athlete-gallery\/athlete-gallery\//g, 'athlete-gallery/');
      
      console.log('Caminho gerado para galeria de atletas:', {
        originalName: file.name,
        uniqueName,
        fileName,
        type: file.type,
        size: file.size
      });
    } 
    // Para outros tipos
    else {
      // Mapeamento explícito de tipos para diretórios adequados
      const prefix = folder || customPrefix || (
        type === 'regulation' ? 'regulamentos' :
        type === 'results' ? 'resultados' :
        type === 'banner' ? 'banners' :
        type === 'carousel' ? 'banners' :
        type === 'banner-carousel' ? 'banners' :
        type === 'header' ? 'header' :
        type === 'athlete-banner' ? 'Banner conheça atletas' :
        'outros')
      
      // Usar o nome original do arquivo para patrocinadores e parceiros
      const useOriginalName = customPrefix === 'patrocinadores' || customPrefix === 'parceiros';
      
      const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const cleanName = file.name
        .toLowerCase()
        .replace(/[^a-z0-9.]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      fileName = useOriginalName 
        ? `${prefix}/${cleanName}`
        : `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    }

    // Log para debug
    console.log('Upload de arquivo:', {
      originalName: file.name,
      fileName,
      type: file.type,
      size: file.size
    });

    // Converte para Buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    try {
      // Para a galeria de atletas, não usamos prefixo adicional
      // pois o fileName já inclui 'athlete-gallery/'
      const prefix = '';
      
      // Log detalhado antes do upload
      console.log('Enviando arquivo para o MinIO:', {
        fileName,
        prefix,
        type: file.type,
        size: buffer.length
      });
      
      // Upload para o MinIO (usando o bucket 'fgc')
      console.log('Iniciando upload para o MinIO:', {
        fileName,
        prefix,
        type: file.type,
        size: buffer.length,
        hasBuffer: !!buffer
      });
      
      const url = await storageService.uploadFile(buffer, {
        filename: fileName, // Já inclui 'athlete-gallery/'
        contentType: file.type,
        size: buffer.length,
        prefix: prefix // Sem prefixo adicional
      })
      
      console.log('Arquivo enviado com sucesso para:', url)
      
      // Se for uma imagem de perfil ou galeria de atleta, processar a URL para usar o proxy
      if (type === 'profile') {
        const proxyUrl = generateUserImageProxyUrl(fileName);
        console.log('URL da imagem de perfil processada para proxy:', {
          originalUrl: url,
          proxyUrl: proxyUrl
        });
        return NextResponse.json({ url, proxyUrl });
      } else if (type === 'athlete-gallery') {
        // Para a galeria de atletas, o caminho já está no formato 'athlete-gallery/nome-unico.extensao'
      // Garantir que não há duplicação de diretórios
      let finalPath = fileName.replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
      
      // Remove 'athlete-gallery/' duplicado se existir
      if (finalPath.startsWith('athlete-gallery/athlete-gallery/')) {
        finalPath = finalPath.replace('athlete-gallery/athlete-gallery/', 'athlete-gallery/');
      }
      
      // Extrai apenas o nome do arquivo (sem o diretório)
      const fileNameOnly = finalPath.split('/').pop() || '';
      
      // Remove qualquer parâmetro de consulta do nome do arquivo
      const cleanFileName = fileNameOnly.split('?')[0];
      
      // Verifica se o nome do arquivo é válido
      if (!cleanFileName) {
        throw new Error('Nome de arquivo inválido para galeria de atletas');
      }
      
      // Gera a URL do proxy para a imagem
      const proxyUrl = `/api/athlete-gallery/image?path=athlete-gallery/${encodeURIComponent(cleanFileName)}`;
        
        console.log('Dados da imagem de galeria processada:', {
          originalUrl: url,
          finalPath,
          fileNameOnly: cleanFileName,
          proxyUrl,
          originalFileName: file.name,
          timestamp: new Date().toISOString()
        });
        
        // Retorna apenas o nome do arquivo para ser armazenado no banco de dados
        // O frontend deve usar o proxyUrl para exibir a imagem
        return NextResponse.json({ 
          // Retorna apenas o nome do arquivo para armazenamento no banco
          url: cleanFileName,
          // URL do proxy para a imagem (para uso imediato no frontend)
          proxyUrl: proxyUrl,
          // Nome do arquivo sem o diretório (mesmo que url neste caso)
          fileName: cleanFileName,
          // Caminho relativo completo para uso no proxy
          relativePath: `athlete-gallery/${cleanFileName}`
        });
      } else if (type === 'news') {
        const proxyUrl = processNewsImageUrl(url);
        console.log('URL da notícia processada para proxy:', {
          originalUrl: url,
          proxyUrl: proxyUrl
        });
        return NextResponse.json({ url, proxyUrl });
      } else if (customPrefix === 'parceiros') {
        // Extrair o nome do arquivo (último segmento do caminho)
        const filename = fileName.split('/').pop() || '';
        
        // Gerar URL do proxy para parceiros
        const proxyUrl = `/api/partners/image?path=${encodeURIComponent(filename)}`;
        
        console.log('URL do parceiro processada para proxy:', {
          originalUrl: url,
          proxyUrl,
          filename
        });
        
        return NextResponse.json({ 
          url: fileName, // Caminho relativo (parceiros/filename)
          proxyUrl,      // URL do proxy (/api/partners/image?path=...)
          fileName: filename // Nome do arquivo sem o diretório
        });
      }
      
      // Para outros tipos, retorna a URL original
      return NextResponse.json({ url });
      
    } catch (error) {
      console.error('Erro durante o upload do arquivo:', error);
      return NextResponse.json(
        { error: 'Erro durante o upload do arquivo' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro no upload:', error)
    return NextResponse.json(
      { error: 'Erro no upload' },
      { status: 500 }
    );
  }
}
