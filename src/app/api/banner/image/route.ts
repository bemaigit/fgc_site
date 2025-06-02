import { NextRequest, NextResponse } from 'next/server';
import { minioClient } from '@/lib/minio';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const path = searchParams.get('path');
    
    if (!path) {
      console.error('[Banner Image Proxy] Parâmetro path não fornecido');
      return new NextResponse('Parâmetro path é obrigatório', { status: 400 });
    }
    
    console.log(`[Banner Image Proxy] Caminho original recebido: "${path}"`);
    
    // Validar se o caminho parece ser uma imagem
    const isValidImagePath = /\.(jpe?g|png|webp|gif|svg)$/i.test(path);
    if (!isValidImagePath) {
      console.error(`[Banner Image Proxy] Caminho não parece ser uma imagem válida: ${path}`);
      return new NextResponse('Caminho não parece ser uma imagem', { status: 400 });
    }
    
    // Validar se o caminho contém 'api/' para evitar loops
    if (path.includes('api/')) {
      console.error(`[Banner Image Proxy] Caminho contém referência à API, possível loop: ${path}`);
      return new NextResponse('Caminho não permitido', { status: 400 });
    }
    
    // Preparar os caminhos alternativos para tentar (original e com/sem modificações)
    const pathsToTry: string[] = [];
    
    // Processar o caminho para garantir compatibilidade com diferentes formatos
    let processedPath = path;
    
    // Caso 1: Se for uma URL completa, extrair apenas o caminho
    if (path.includes('://')) {
      try {
        const urlObj = new URL(path);
        processedPath = urlObj.pathname.replace(/^\/storage\//, '').replace(/^\/fgc\//, '');
      } catch (error) {
        console.error('Erro ao processar URL completa:', error);
      }
    } 
    // Caso 2: Se começar com /storage/, remover esse prefixo
    else if (path.startsWith('/storage/')) {
      processedPath = path.substring(9); // Remove '/storage/'
    }
    // Caso 3: Se começar com /fgc/, remover esse prefixo
    else if (path.startsWith('/fgc/')) {
      processedPath = path.substring(5); // Remove '/fgc/'
    }
    // Caso 4: Se começar com storage/, remover esse prefixo
    else if (path.startsWith('storage/')) {
      processedPath = path.substring(8); // Remove 'storage/'
    }
    // Caso 5: Se começar com fgc/, remover esse prefixo
    else if (path.startsWith('fgc/')) {
      processedPath = path.substring(4); // Remove 'fgc/'
    }
    
    // Caso especial: Se tiver duplicação de 'storage/storage/' no caminho
    processedPath = processedPath.replace(/^storage\/storage\//, 'storage/');
    
    // Adicionar caminho processado à lista de tentativas
    pathsToTry.push(processedPath);
    
    // Se o caminho processado tem espaços, adicionar alternativa com hífens
    if (processedPath.includes(' ')) {
      pathsToTry.push(processedPath.replace(/\s+/g, '-'));
    }
    
    // Se o caminho processado tem hífens, adicionar alternativa com espaços
    if (processedPath.includes('-')) {
      pathsToTry.push(processedPath.replace(/-+/g, ' '));
    }
    
    // Para casos onde o caminho pode estar em diretórios diferentes
    if (!processedPath.startsWith('banners/') && 
        !processedPath.startsWith('outros/') && 
        !processedPath.startsWith('Banner conheça atletas/')) {
      
      // Extrair o nome do arquivo (independente da estrutura de pastas)
      const filename = processedPath.split('/').pop() || processedPath;
      
      // Tentar com os prefixos conhecidos
      pathsToTry.push(`banners/${filename}`);
      pathsToTry.push(`outros/${filename}`);
      pathsToTry.push(`Banner conheça atletas/${filename}`);
    }
    
    // Se o caminho começa com 'outros/', também tentar em 'banners/'
    if (processedPath.startsWith('outros/')) {
      const filename = processedPath.split('/').pop() || processedPath;
      pathsToTry.push(`banners/${filename}`);
    }
    
    // Se o caminho começa com 'banners/', também tentar em 'outros/'
    if (processedPath.startsWith('banners/')) {
      const filename = processedPath.split('/').pop() || processedPath;
      pathsToTry.push(`outros/${filename}`);
    }
    
    console.log(`[Banner Image Proxy] Caminhos a tentar:`, pathsToTry);
    
    // Determinar tipo de conteúdo com base na extensão
    let contentType = 'image/png'; // Padrão
    if (processedPath.endsWith('.jpg') || processedPath.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (processedPath.endsWith('.webp')) {
      contentType = 'image/webp';
    } else if (processedPath.endsWith('.svg')) {
      contentType = 'image/svg+xml';
    } else if (processedPath.endsWith('.gif')) {
      contentType = 'image/gif';
    }
    
    // Variáveis para armazenar o resultado da tentativa bem-sucedida
    let fileBuffer: Buffer | null = null;
    let successPath: string | null = null;
    
    // Tentar cada caminho alternativo
    for (const testPath of pathsToTry) {
      try {
        console.log(`[Banner Image Proxy] Tentando buscar: bucket="${process.env.MINIO_BUCKET}", objeto="${testPath}"`);
        
        // Usar a versão de stream do método getObject
        const fileStream = await minioClient.getObject(
          process.env.MINIO_BUCKET!,
          testPath
        );
        
        // Coletar os chunks de dados em um array de buffers
        const chunks: Buffer[] = [];
        
        // Processar a stream de dados
        for await (const chunk of fileStream) {
          chunks.push(chunk);
        }
        
        // Combinar todos os chunks em um único buffer
        fileBuffer = Buffer.concat(chunks);
        successPath = testPath;
        
        console.log(`[Banner Image Proxy] Imagem carregada com sucesso: ${testPath}, tamanho: ${fileBuffer.length} bytes`);
        break; // Sair do loop se encontrou o arquivo
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(`[Banner Image Proxy] Falha ao buscar "${testPath}": ${errorMsg}`);
        // Continua para tentar o próximo caminho
      }
    }
    
    // Se encontrou uma versão do arquivo, retorna-o
    if (fileBuffer && successPath) {
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
    
    // Se chegou aqui, nenhuma das tentativas funcionou
    console.error(`[Banner Image Proxy] Não foi possível encontrar o arquivo em nenhum dos caminhos testados`);
    
    // Usar o sistema de fallback para banners
    try {
      const { ImageFallbackManager } = await import('@/lib/imageUtils');
      const fallbackResponse = ImageFallbackManager.getFallbackImage({
        category: 'banners',
        contentType
      });
      
      if (fallbackResponse) {
        console.log('[Banner Image Proxy] Servindo imagem de fallback');
        return fallbackResponse;
      }
    } catch (fallbackError) {
      console.error('[Banner Image Proxy] Erro ao buscar imagem de fallback:', fallbackError);
    }
    
    return new NextResponse('Erro ao carregar imagem, arquivo não encontrado', { status: 404 });
  } catch (error) {
    console.error('[Banner Image Proxy] Erro interno:', error);
    return new NextResponse('Erro interno do servidor', { status: 500 });
  }
}
