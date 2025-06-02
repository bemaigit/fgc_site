import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/storage';

// Tempo de cache padrão para navegadores (24 horas)
const BROWSER_CACHE_MAX_AGE = 60 * 60 * 24; // 24 horas
// Tempo de cache para CDN (7 dias)
const CDN_CACHE_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    let path = searchParams.get('path');

    // Se não houver caminho, retornar erro
    if (!path) {
      console.error('[Proxy Athlete Image] Caminho da imagem não fornecido');
      return new NextResponse('Caminho da imagem não fornecido', { status: 400 });
    }

    console.log(`[Proxy Athlete Image] Processando requisição para: ${path}`);

    // Decodificar o caminho para lidar com caracteres especiais
    path = decodeURIComponent(path);

    // Remover barras iniciais e finais
    path = path.replace(/^\/+|\/+$/g, '');

    // Se for uma URL completa, tentar extrair o caminho
    if (path.startsWith('http')) {
      try {
        const urlObj = new URL(path);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        
        // Se for uma URL do MinIO/S3 ou similar, extrair o caminho após o bucket
        if (urlObj.hostname.includes('minio') || 
            urlObj.hostname.includes('s3.') || 
            urlObj.hostname.includes('amazonaws.com')) {
          if (pathParts.length > 1) {
            path = pathParts.slice(1).join('/');
            console.log(`[Proxy Athlete Image] Caminho extraído de URL S3: ${path}`);
          }
        } else {
          // Para outras URLs, pegar apenas o nome do arquivo
          path = pathParts.pop() || '';
          console.log(`[Proxy Athlete Image] Nome do arquivo extraído: ${path}`);
        }
      } catch (e) {
        console.error('[Proxy Athlete Image] Erro ao processar URL:', e);
        // Em caso de erro, continuar com o caminho original
      }
    }

    // Verificar se o caminho contém 'perfil atleta' e ajustar
    if (path.includes('perfil atleta')) {
      const fileName = path.split('/').pop() || '';
      console.log(`[Proxy Athlete Image] Detectado caminho 'perfil atleta', extraindo filename: ${fileName}`);
      path = fileName;
    }

    console.log(`[Proxy Athlete Image] DEBUG: Processando path: ${path}`);
    
    // Extrair apenas o nome do arquivo se estiver no formato http://localhost:9000/fgc/perfil atleta/...
    const pathMatch = path.match(/\/fgc\/perfil atleta\/([^?]+)(\?.*)?$/);
    if (pathMatch) {
      const fileName = pathMatch[1];
      console.log(`[Proxy Athlete Image] Extraído nome do arquivo de URL do MinIO: ${fileName}`);
      path = fileName;
    } else {
      // Verificar se é apenas o nome do arquivo
      const fileNameOnly = path.split('/').pop() || path;
      console.log(`[Proxy Athlete Image] Nome do arquivo extraído: ${fileNameOnly}`);
    }
    
    // Lista de caminhos para tentar, em ordem de prioridade
    const pathVariations = [
      // Tentar exatamente com o caminho 'perfil atleta' (usado atualmente)
      `perfil atleta/${path}`,
      
      // Tentar o caminho exato como está
      path,
      
      // Tentar com o prefixo 'athlete/profile/'
      `athlete/profile/${path}`,
      
      // Tentar com prefixo 'athlete/'
      `athlete/${path}`,
      
      // Tentar apenas o nome do arquivo
      path.split('/').pop() || path,
      
      // Tentar na raiz do bucket
      path.split('/').pop() || path,
      
      // Tentar com outros prefixos para compatibilidade
      `athlete/gallery/${path}`,
      `perfil/${path}`,
      `perfil-atleta/${path}`
    ];

    // Remover duplicatas mantendo a ordem
    const uniquePaths = [...new Set(pathVariations)];
    
    console.log(`[Proxy Athlete Image] Tentando variações de caminho:`, uniquePaths);

    let buffer: Buffer | null = null;
    let contentType = 'image/jpeg'; // Padrão
    let finalPath = '';

    // Tentar cada variação de caminho até encontrar a imagem
    for (const currentPath of uniquePaths) {
      if (!currentPath) continue;
      
      try {
        console.log(`[Proxy Athlete Image] Tentando buscar: ${currentPath}`);
        
        // Determinar o tipo MIME baseado na extensão do arquivo
        if (currentPath.endsWith('.jpg') || currentPath.endsWith('.jpeg')) {
          contentType = 'image/jpeg';
        } else if (currentPath.endsWith('.png')) {
          contentType = 'image/png';
        } else if (currentPath.endsWith('.webp')) {
          contentType = 'image/webp';
        } else if (currentPath.endsWith('.svg')) {
          contentType = 'image/svg+xml';
        } else if (currentPath.endsWith('.gif')) {
          contentType = 'image/gif';
        }
        
        // Tenta obter o arquivo
        const fileStream = await storageService.getFileStream(currentPath);
        if (!fileStream) {
          console.log(`[Proxy Athlete Image] Arquivo não encontrado: ${currentPath}`);
          continue;
        }
        
        // Converter ReadableStream para Buffer
        const chunks = [];
        for await (const chunk of fileStream) {
          chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk));
        }
        
        buffer = Buffer.concat(chunks);
        finalPath = currentPath;
        console.log(`[Proxy Athlete Image] Arquivo encontrado em: ${currentPath}`);
        break; // Sai do loop quando encontrar o arquivo
        
      } catch (error) {
        console.error(`[Proxy Athlete Image] Erro ao buscar ${currentPath}:`, error);
        continue; // Tenta a próxima variação
      }
    }

    // Se não encontrou o arquivo em nenhuma variação
    if (!buffer) {
      console.error(`[Proxy Athlete Image] Arquivo não encontrado em nenhuma variação: ${path}`);
      return new NextResponse('Imagem não encontrada', { status: 404 });
    }
    
    console.log(`[Proxy Athlete Image] Retornando imagem de: ${finalPath} (${contentType}, ${buffer.length} bytes)`);
    
    // Configurar headers de cache
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', buffer.length.toString());
    headers.set('Cache-Control', `public, max-age=${BROWSER_CACHE_MAX_AGE}, s-maxage=${CDN_CACHE_MAX_AGE}, stale-while-revalidate=604800`);
    
    // Adicionar header de CDN cache
    headers.set('CDN-Cache-Control', `max-age=${CDN_CACHE_MAX_AGE}`);
    
    // Se for uma imagem SVG, adicionar header de segurança
    if (contentType === 'image/svg+xml') {
      headers.set('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox;");
    }
    
    // Retornar a imagem com os headers apropriados
    return new NextResponse(buffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error(`[Proxy Athlete Image] Erro ao processar requisição:`, error);
    return new NextResponse('Erro ao processar imagem', { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}
