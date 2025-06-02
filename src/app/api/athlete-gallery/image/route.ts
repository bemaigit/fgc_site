import { NextRequest, NextResponse } from 'next/server'
import { storageService } from '@/lib/storage'
import { extname } from 'path'

// Headers CORS reutilizáveis
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Função para criar uma resposta CORS
function corsResponse(status = 200, body: any = null, headers: Record<string, string> = {}) {
  return new Response(body, {
    status,
    headers: {
      ...corsHeaders,
      ...headers,
    },
  });
}

// Configurações 
const MAX_PATH_ATTEMPTS = 5; // Número máximo de tentativas por caminho
const MAX_FILE_SIZE_MB = 10; // Tamanho máximo do arquivo em MB

// Manipulador de requisições OPTIONS para CORS preflight
export async function OPTIONS() {
  return corsResponse(204, null, {
    'Allow': 'GET, OPTIONS',
    'Content-Length': '0',
  });
}

export async function GET(req: NextRequest) {
  // Conjunto de caminhos testados NESTA requisição (escopo local)
  const testedPaths = new Set<string>();
  let path: string | null = null;
  const startTime = Date.now();
  
  try {
    const { searchParams } = req.nextUrl;
    path = searchParams.get('path');
    
    if (!path) {
      const errorDetails = {
        url: req.url,
        searchParams: Object.fromEntries(searchParams.entries()),
        timestamp: new Date().toISOString()
      };
      
      console.error('Requisição sem parâmetro path:', errorDetails);
      
      return corsResponse(400, JSON.stringify({ 
        error: 'Path não fornecido',
        details: 'O parâmetro "path" é obrigatório',
        timestamp: new Date().toISOString()
      }), { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
    }

    console.log('Iniciando busca de imagem:', { 
      path,
      url: req.url,
      timestamp: new Date().toISOString()
    });
    
    // Remove parâmetros de consulta e decodifica a URL
    const cleanPath = decodeURIComponent(path.split('?')[0]);
    
    // Remove o prefixo 'athlete-gallery/' se existir
    let normalizedPath = cleanPath.startsWith('athlete-gallery/')
      ? cleanPath.substring('athlete-gallery/'.length)
      : cleanPath;
      
    // Remove o prefixo 'storage/' se existir
    normalizedPath = normalizedPath.startsWith('storage/')
      ? normalizedPath.substring('storage/'.length)
      : normalizedPath;
    
    // Remove barras iniciais e finais
    normalizedPath = normalizedPath.replace(/^\/+|\/+$/g, '');
    
    // Extrai apenas o nome do arquivo (última parte do caminho)
    const pathParts = normalizedPath.split('/');
    let fileName = pathParts[pathParts.length - 1] || '';
    
    // Se o nome do arquivo estiver vazio, tenta usar o caminho completo
    if (!fileName) {
      fileName = normalizedPath;
    }
    
    if (!fileName) {
      const errorMessage = `Não foi possível extrair o nome do arquivo do caminho: ${path}`;
      const errorDetails = { 
        path, 
        cleanPath, 
        normalizedPath, 
        pathParts,
        timestamp: new Date().toISOString() 
      };
      
      console.error(errorMessage, errorDetails);
      
      return corsResponse(400, JSON.stringify({
        error: 'Caminho de arquivo inválido',
        details: errorMessage,
        timestamp: new Date().toISOString()
      }), {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
    }
    
    // Inicializa a resposta como nula
    let fileContent: Buffer | null = null;
    
    // Registramos o caminho que estamos tentando para referência
    const pathKey = `${normalizedPath}:${fileName}`;
    testedPaths.add(pathKey);
    
    // Registre apenas para debug
    console.log('Tentando caminho:', {
      pathKey,
      tentativa: testedPaths.size,
      timestamp: new Date().toISOString()
    });
    // Limpa o conjunto de caminhos testados se ficar muito grande
    if (testedPaths.size > 1000) {
      testedPaths.clear();
    }
    
    // Gera caminhos únicos para tentar
    const pathVariations = new Set<string>();
    
    // Adiciona o caminho normalizado
    pathVariations.add(normalizedPath);
    
    // Adiciona variações do nome do arquivo
    const nameVariations = [
      fileName,
      fileName.toLowerCase(),
      fileName.toUpperCase(),
      fileName.charAt(0).toUpperCase() + fileName.slice(1).toLowerCase()
    ];
    
    // Gera combinações de prefixos e variações de nome
    const prefixes = [
      '',
      'athlete-gallery/',
      'storage/athlete-gallery/',
      'storage/'
    ];
    
    // Adiciona todas as combinações possíveis
    for (const prefix of prefixes) {
      for (const name of nameVariations) {
        const path = prefix + name;
        if (path && !path.includes('//')) { // Evita caminhos com barras duplas
          pathVariations.add(path);
        }
      }
    }
    
    // Converte para array e limpa caminhos vazios
    const uniquePaths = Array.from(pathVariations).filter(p => p && p.trim() !== '');
    
    console.log('Caminhos possíveis para busca:', uniquePaths);
    
    // Tenta cada caminho possível até encontrar o arquivo
    for (const filePath of uniquePaths) {
      if (!filePath) continue;
      
      console.log('Tentando encontrar arquivo em:', filePath);
      
      try {
        // Tenta buscar o arquivo no storage
        fileContent = await storageService.getFile(filePath, '');
        
        if (fileContent && fileContent.length > 0) {
          const fileSizeKB = Math.round(fileContent.length / 1024 * 100) / 100; // Tamanho em KB
          console.log('Arquivo encontrado com sucesso:', { 
            path: filePath, 
            size: `${fileSizeKB} KB`,
            timestamp: new Date().toISOString() 
          });
          
          // Limpa o cache de caminhos testados após encontrar o arquivo
          testedPaths.clear();
          break;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        const isNotFound = errorMessage.toLowerCase().includes('not found') || 
                         errorMessage.toLowerCase().includes('não encontrado');
        
        if (isNotFound) {
          console.log(`Arquivo não encontrado em: ${filePath}`);
        } else {
          console.error(`Erro ao buscar arquivo em ${filePath}:`, errorMessage);
          // Se não for um erro 404, registra o erro completo para depuração
          if (!isNotFound) {
            console.error('Detalhes do erro:', {
              error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
              } : error,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }
  
    // Se não encontrou o arquivo em nenhum caminho, retorna 404 com detalhes
    if (!fileContent || fileContent.length === 0) {
      const errorMessage = `Imagem não encontrada após tentar ${uniquePaths.length} caminhos`;
      const errorDetails = {
        path, 
        cleanPath,
        normalizedPath, 
        fileName,
        possiblePaths: uniquePaths,
        timestamp: new Date().toISOString(),
        searchDuration: `${Date.now() - startTime}ms`
      };
      
      console.error(errorMessage, errorDetails);
      
      return corsResponse(404, JSON.stringify({ 
        error: 'Imagem não encontrada',
        details: `Arquivo '${fileName}' não encontrado em nenhum dos caminhos tentados`,
        triedPaths: uniquePaths,
        timestamp: new Date().toISOString()
      }), { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Search-Duration': `${Date.now() - startTime}ms`
      });
    }

    // Detecta o tipo de conteúdo baseado na extensão do arquivo
    const extension = extname(path).toLowerCase();
    const contentType = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.bmp': 'image/bmp',
      '.tiff': 'image/tiff'
    }[extension] || 'application/octet-stream';

    const fileSizeKB = Math.round(fileContent.length / 1024 * 100) / 100; // Tamanho em KB
    
    // Log de sucesso com métricas de desempenho
    console.log('Enviando resposta com sucesso:', {
      path,
      extension,
      contentType,
      fileSize: `${fileSizeKB} KB`,
      searchDuration: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString(),
      cacheStatus: 'MISS' // Indica que a imagem não estava em cache
    });

    // Retorna a imagem com os headers apropriados
    return corsResponse(200, fileContent, {
      'Content-Type': contentType,
      'Content-Length': fileContent.length.toString(),
      'Cache-Control': 'public, max-age=31536000, immutable', // Cache por 1 ano
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'",
      'X-Image-Size': `${fileSizeKB} KB`,
      'X-Request-Duration': `${Date.now() - startTime}ms`,
      'Vary': 'Accept-Encoding',
      'Timing-Allow-Origin': '*'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao buscar imagem';
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log detalhado do erro
    console.error('Erro ao processar requisição de imagem:', {
      errorId,
      message: errorMessage,
      path: path,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
      searchDuration: `${Date.now() - startTime}ms`,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error as any).code && { code: (error as any).code },
        ...(error as any).statusCode && { statusCode: (error as any).statusCode }
      } : error
    });
    
    // Determina o status code apropriado
    let statusCode = 500;
    if (errorMessage.toLowerCase().includes('not found') || errorMessage.toLowerCase().includes('não encontrado')) {
      statusCode = 404;
    } else if (errorMessage.toLowerCase().includes('permission denied') || errorMessage.toLowerCase().includes('acesso negado')) {
      statusCode = 403;
    } else if (errorMessage.toLowerCase().includes('bad request') || errorMessage.toLowerCase().includes('requisição inválida')) {
      statusCode = 400;
    }
    
    // Retorna resposta de erro estruturada
    return corsResponse(statusCode, JSON.stringify({ 
      error: statusCode === 404 ? 'Imagem não encontrada' : 'Erro ao processar a requisição',
      message: errorMessage,
      errorId,
      timestamp: new Date().toISOString(),
      path: path || 'não especificado'
    }), { 
      'Content-Type': 'application/json',
      'X-Error-ID': errorId,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Request-Duration': `${Date.now() - startTime}ms`
    });
  }
}
