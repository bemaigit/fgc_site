import { NextRequest, NextResponse } from 'next/server';
import { minioClient } from '@/lib/minio';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const path = searchParams.get('path');
    
    if (!path) {
      console.error('[Gallery Image Proxy] Parâmetro path não fornecido');
      return new NextResponse('Parâmetro path é obrigatório', { status: 400 });
    }
    
    console.log(`[Gallery Image Proxy] Caminho original recebido: "${path}"`);
    
    // Validar se o caminho parece ser uma imagem (verificamos apenas a extensão para não bloquear caminhos válidos)
    const hasImageExtension = /\.(jpe?g|png|webp|gif|svg)/i.test(path);
    if (!hasImageExtension) {
      console.error(`[Gallery Image Proxy] Caminho não parece ser uma imagem válida: ${path}`);
      return new NextResponse('Caminho não parece ser uma imagem', { status: 400 });
    }
    
    // Preparar os caminhos alternativos para tentar (original e com/sem modificações)
    const pathsToTry: string[] = [];
    
    // Processar o caminho para garantir compatibilidade com diferentes formatos
    let processedPath = path;
    
    // Caso especial: Se o caminho vier de /api/proxy/storage/
    if (path.includes('/api/proxy/storage/')) {
      const storagePathMatch = path.match(/\/api\/proxy\/storage\/(.+)/);
      if (storagePathMatch && storagePathMatch[1]) {
        processedPath = storagePathMatch[1];
        console.log(`[Gallery Image Proxy] Caminho de proxy detectado e extraído:`, {
          original: path,
          extracted: processedPath
        });
      }
    }
    // Caso 1: Se for uma URL completa, extrair apenas o caminho
    else if (path.includes('://')) {
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
    if (!processedPath.startsWith('galeria/')) {
      // Adicionar versão com prefixo 'galeria/'
      const filename = processedPath.split('/').pop() || processedPath;
      pathsToTry.push(`galeria/${filename}`);
    }
    
    console.log(`[Gallery Image Proxy] Caminhos a tentar:`, pathsToTry);
    
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
        console.log(`[Gallery Image Proxy] Tentando buscar: bucket="${process.env.MINIO_BUCKET}", objeto="${testPath}"`);
        
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
        
        console.log(`[Gallery Image Proxy] Imagem carregada com sucesso: ${testPath}, tamanho: ${fileBuffer.length} bytes`);
        break; // Sair do loop se encontrou o arquivo
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(`[Gallery Image Proxy] Falha ao buscar "${testPath}": ${errorMsg}`);
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
    console.error(`[Gallery Image Proxy] Não foi possível encontrar o arquivo em nenhum dos caminhos testados`);
    
    // Usar o sistema de fallback para galeria
    try {
      const { ImageFallbackManager } = await import('@/lib/imageUtils');
      
      // Determinar o tipo MIME baseado na extensão do arquivo
      let contentType = 'image/png'; // Padrão para imagens
      
      if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
        contentType = 'image/jpeg';
      } else if (path.endsWith('.webp')) {
        contentType = 'image/webp';
      } else if (path.endsWith('.svg')) {
        contentType = 'image/svg+xml';
      } else if (path.endsWith('.gif')) {
        contentType = 'image/gif';
      }
      
      const fallbackResponse = ImageFallbackManager.getFallbackImage({
        category: 'gallery',  // Usar o diretório de galeria
        contentType
      });
      
      if (fallbackResponse) {
        console.log('[Gallery Image Proxy] Servindo imagem de fallback');
        return fallbackResponse;
      }
    } catch (fallbackError) {
      console.error('[Gallery Image Proxy] Erro ao buscar imagem de fallback:', fallbackError);
    }
    
    // Se o sistema de fallback falhar, tentar o método antigo como última opção
    try {
      const fs = require('fs');
      const nodePath = require('path');
      const placeholderPath = nodePath.join(process.cwd(), 'public', 'images', 'gallery-placeholder.jpg');
      if (fs.existsSync(placeholderPath)) {
        const placeholderBuffer = fs.readFileSync(placeholderPath);
        return new NextResponse(placeholderBuffer, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      } else {
        console.error('[Gallery Image Proxy] Placeholder não encontrado:', placeholderPath);
      }
    } catch (placeholderError) {
      console.error('[Gallery Image Proxy] Erro ao servir placeholder:', placeholderError);
    }
    return new NextResponse('Erro ao carregar imagem, arquivo não encontrado', { status: 404 });
  } catch (error) {
    console.error('[Gallery Image Proxy] Erro interno:', error);
    return new NextResponse('Erro interno do servidor', { status: 500 });
  }
}
