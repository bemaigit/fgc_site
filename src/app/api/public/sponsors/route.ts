import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Lista apenas os patrocinadores ativos para exibição pública
export async function GET(request: NextRequest) {
  try {
    console.log('[API Public Sponsors] Iniciando busca de patrocinadores ativos');
    
    const sponsors = await prisma.sponsor.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });

    console.log(`[API Public Sponsors] Patrocinadores encontrados: ${sponsors.length}`);
    
    if (sponsors.length === 0) {
      console.log('[API Public Sponsors] Nenhum patrocinador ativo encontrado');
      return NextResponse.json([]);
    }
    
    try {
      // Obter a base URL do ambiente ou do request
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
        (request.headers.get('host') ? 
          `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}` : 
          'http://localhost:3000');
      
      console.log(`[API Public Sponsors] Usando base URL: ${baseUrl}`);
      
      // Processar as imagens para usar nosso endpoint de proxy
      const sponsorsWithUrls = sponsors.map(sponsor => {
        // Processar o logo (caminho da imagem)
        let path = sponsor.logo;
        console.log(`[API Public Sponsors] Processando logo original: ${path}`);
        
        // Se for uma URL completa, extrair apenas o caminho
        if (path.includes('://')) {
          try {
            const urlObj = new URL(path);
            path = urlObj.pathname
              .replace(/^\/storage\//, '')
              .replace(/^\/fgc\//, '');
            console.log(`[API Public Sponsors] Extraído caminho da URL: ${path}`);
          } catch (error) {
            console.error('[API Public Sponsors] Erro ao processar URL:', error);
          }
        }
        // Caso 2: Se começar com /storage/, remover esse prefixo
        else if (path.startsWith('/storage/')) {
          path = path.substring(9); // Remove '/storage/'
        }
        // Caso 3: Se começar com /fgc/, remover esse prefixo
        else if (path.startsWith('/fgc/')) {
          path = path.substring(5); // Remove '/fgc/'
        }
        
        // Se ainda não tem o prefixo patrocinadores, adicionar
        if (!path.startsWith('patrocinadores/')) {
          const filename = path.split('/').pop() || path;
          path = `patrocinadores/${filename}`;
          console.log(`[API Public Sponsors] Adicionado prefixo patrocinadores: ${path}`);
        }
        
        // Construir URL para o proxy de imagens
        const proxyUrl = `${baseUrl}/api/sponsor/image?path=${encodeURIComponent(path)}`;
        console.log(`[API Public Sponsors] URL final para ${sponsor.name}: ${proxyUrl}`);
        
        return {
          ...sponsor,
          logo: proxyUrl
        };
      });

      return NextResponse.json(sponsorsWithUrls);
    } catch (error) {
      console.error('[API Public Sponsors] Erro ao processar URLs:', error);
      // Retorna os patrocinadores sem converter as URLs em caso de erro
      return NextResponse.json(sponsors);
    }
  } catch (error) {
    console.error('[API Public Sponsors] Erro ao buscar patrocinadores:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar patrocinadores' },
      { status: 500 }
    );
  }
}
