import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const path = searchParams.get('path');

    if (!path) {
      console.error('Caminho da logo do footer não fornecido');
      return new NextResponse('Caminho da imagem não fornecido', { status: 400 });
    }

    console.log(`Processando requisição para logo do footer: ${path}`);

    // Define o prefixo para a pasta de logos do footer no MinIO
    storageService.setPrefix('footer');

    // Tenta obter a imagem
    try {
      const fileStream = await storageService.getFileStream(path);
      if (!fileStream) {
        throw new Error('Arquivo não encontrado');
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
      console.error(`[Proxy Footer Logo] Erro ao obter imagem ${path}:`, error);
      
      // Tentar novamente com caminho alternativo (sem prefixo)
      try {
        console.log(`[Proxy Footer Logo] Tentando caminho alternativo para: ${path}`);
        storageService.setPrefix(''); // Sem prefixo
        
        const fileStream = await storageService.getFileStream(`footer/${path}`);
        if (!fileStream) {
          throw new Error('Arquivo não encontrado no caminho alternativo');
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
      } catch (secondError) {
        console.error(`[Proxy Footer Logo] Erro ao obter imagem no caminho alternativo ${path}:`, secondError);
        
        // Usar o sistema de fallback para logos
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
            category: 'header',  // Usando header como fallback, já que temos o logo do header
            contentType
          });
          
          if (fallbackResponse) {
            console.log('[Proxy Footer Logo] Servindo imagem de fallback');
            return fallbackResponse;
          }
        } catch (fallbackError) {
          console.error('[Proxy Footer Logo] Erro ao buscar imagem de fallback:', fallbackError);
        }
        
        // Se o sistema de fallback também falhar, redirecionar para a imagem estática
        return NextResponse.redirect(new URL('/images/logo-fgc.png', req.nextUrl.origin));
      }
    }
  } catch (error) {
    console.error('[Proxy Footer Logo] Erro geral:', error);
    return new NextResponse('Erro ao processar imagem', { status: 500 });
  }
}
