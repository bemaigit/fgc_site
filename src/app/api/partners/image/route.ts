import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/storage';

// Função auxiliar para tentar diferentes variações de caminhos
async function tryMultiplePaths(originalPath: string) {
  // Lista de tentativas de caminhos diferentes
  const pathVariations = [
    originalPath,                                      // Caminho original
    originalPath.replace(/ /g, '%20'),                // Substituir espaços por %20
    originalPath.replace(/ /g, '_'),                  // Substituir espaços por _
    encodeURIComponent(originalPath),                 // Codificar todo o caminho
    originalPath.split('/').map(part => 
      encodeURIComponent(part)).join('/'),            // Codificar cada parte do caminho separadamente
    `parceiros/${originalPath}`,                      // Tentar com prefixo parceiros
    `parceiros/${originalPath.replace(/ /g, '%20')}`, // Prefixo + subst. espaços
  ];
  
  // Tentativas com diferentes configurações de prefixo
  const prefixConfigurations = ['parceiros', ''];
  
  // Tenta cada combinação de prefixo e caminho
  for (const prefix of prefixConfigurations) {
    storageService.setPrefix(prefix);
    
    for (const path of pathVariations) {
      try {
        console.log(`Tentando obter arquivo: ${path} (com prefixo: ${prefix || 'nenhum'})`); 
        const fileStream = await storageService.getFileStream(path);
        if (fileStream) {
          return fileStream; // Retorna o primeiro stream válido encontrado
        }
      } catch (error) {
        // Continua tentando outras variações silenciosamente
      }
    }
  }
  
  return null; // Nenhuma das tentativas funcionou
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const path = searchParams.get('path');

    if (!path) {
      console.error('Caminho da imagem do parceiro não fornecido');
      return new NextResponse('Caminho da imagem não fornecido', { status: 400 });
    }

    console.log(`Processando requisição para imagem de parceiro: ${path}`);

    // Usar a função auxiliar para tentar diferentes variações de caminhos
    const fileStream = await tryMultiplePaths(path);
    
    if (!fileStream) {
      console.error(`Não foi possível encontrar a imagem: ${path} após tentar várias variações`);
      
      // Usar o sistema de fallback para parceiros
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
          category: 'partners',  // Usar o diretório de parceiros
          contentType
        });
        
        if (fallbackResponse) {
          console.log('[Proxy Partners] Servindo imagem de fallback');
          return fallbackResponse;
        }
      } catch (fallbackError) {
        console.error('[Proxy Partners] Erro ao buscar imagem de fallback:', fallbackError);
      }
      
      // Se o sistema de fallback também falhar, redirecionar para a imagem estática
      return NextResponse.redirect(new URL('/images/partner-placeholder.jpg', req.nextUrl.origin));
    }
    
    // Converter ReadableStream para Buffer
    const chunks = [];
    for await (const chunk of fileStream) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    
    const buffer = Buffer.concat(chunks);

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
    
    // Adicionar headers para a resposta
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', buffer.length.toString());
    
    // Adicionar cache headers
    headers.set('Cache-Control', 'public, max-age=86400'); // 24 horas
    
    return new NextResponse(buffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('[Proxy Parceiro] Erro geral:', error);
    return new NextResponse('Erro ao processar imagem', { status: 500 });
  }
}
