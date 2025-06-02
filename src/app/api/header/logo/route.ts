import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    let path = searchParams.get('path');
    
    // Se a URL for completa, extrair apenas o nome do arquivo
    if (path) {
      if (path.includes('https://') || path.includes('http://')) {
        console.log('[Proxy Header Logo] URL completa detectada:', path);
        
        // Tratar URLs do formato https://dev.bemai.com.br/storage/header/1747235294290-kydolz2iqn9.png
        if (path.includes('storage/header/')) {
          const parts = path.split('storage/header/');
          if (parts.length > 1) {
            path = parts[1];
            console.log('[Proxy Header Logo] Nome do arquivo extraído:', path);
          }
        }
        // Caso seja uma URL completa sem o padrão storage/header/
        else {
          // Obter apenas o nome do arquivo
          path = path.split('/').pop() || '';
          console.log('[Proxy Header Logo] Nome do arquivo extraído de URL genérica:', path);
        }
      }
    }

    if (!path) {
      console.error('[Proxy Header Logo] Caminho da logo não fornecido');
      return new NextResponse('Caminho da imagem não fornecido', { status: 400 });
    }

    console.log(`[Proxy Header Logo] Processando requisição para logo: ${path}`);

    // Define o prefixo para a pasta de logos do header no MinIO
    storageService.setPrefix('header');

    // Tenta obter a imagem
    try {
      console.log(`[Proxy Header Logo] Tentando buscar arquivo: ${path} com prefixo 'header'`);
      const fileStream = await storageService.getFileStream(path);
      if (!fileStream) {
        throw new Error('Arquivo não encontrado com prefixo');
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
      console.error(`[Proxy Header Logo] Erro ao obter imagem ${path}:`, error);
      
      // Tentar novamente com caminho alternativo (sem prefixo)
      try {
        console.log(`[Proxy Header Logo] Tentando caminho alternativo para: header/${path}`);
        storageService.setPrefix(''); // Sem prefixo
        
        const fileStream = await storageService.getFileStream(`header/${path}`);
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
        console.error(`[Proxy Header Logo] Erro ao obter imagem no caminho alternativo ${path}:`, secondError);
        console.log('[Proxy Header Logo] Retornando imagem padrão como fallback');
        
        // Retorna logo padrão como fallback
        return NextResponse.redirect(new URL('/images/logo-fgc-dark.png', req.nextUrl.origin));
      }
    }
  } catch (error) {
    console.error('[Proxy Header Logo] Erro geral:', error);
    return new NextResponse('Erro ao processar imagem', { status: 500 });
  }
}
