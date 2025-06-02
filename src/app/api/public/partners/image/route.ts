import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/storage';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const path = searchParams.get('path');
    
    if (!path) {
      return new NextResponse('Parâmetro path é obrigatório', { status: 400 });
    }
    
    // Determinar tipo de conteúdo com base na extensão
    let contentType = 'image/png'; // Padrão
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (path.endsWith('.webp')) {
      contentType = 'image/webp';
    } else if (path.endsWith('.svg')) {
      contentType = 'image/svg+xml';
    }
    
    console.log(`Buscando imagem no MinIO: ${path}`);
    
    try {
      // Define o prefixo para parceiros
      storageService.setPrefix('parceiros');
      
      // Usar a versão de stream do método getFileStream do nosso serviço
      const fileStream = await storageService.getFileStream(path);
      
      if (!fileStream) {
        throw new Error('Arquivo não encontrado');
      }
      
      // Coletar os chunks de dados em um array de buffers
      const chunks = [];
      
      // Processar a stream de dados
      for await (const chunk of fileStream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      
      // Combinar todos os chunks em um único buffer
      const fileBuffer = Buffer.concat(chunks);
      
      // Enviar resposta com o buffer da imagem
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch (error) {
      console.error('Erro ao buscar ou processar arquivo do MinIO:', error);
      
      // Tentar novamente com caminho alternativo
      try {
        console.log(`Tentando caminho alternativo para: ${path}`);
        storageService.setPrefix('');
        
        const fileStream = await storageService.getFileStream(`parceiros/${path}`);
        
        if (!fileStream) {
          throw new Error('Arquivo não encontrado no caminho alternativo');
        }
        
        // Coletar os chunks de dados
        const chunks = [];
        for await (const chunk of fileStream) {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        
        const fileBuffer = Buffer.concat(chunks);
        
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400',
          },
        });
      } catch (secondError) {
        console.error(`Erro ao buscar imagem no caminho alternativo ${path}:`, secondError);
        // Redirecionar para imagem padrão
        return NextResponse.redirect(new URL('/images/partner-placeholder.jpg', req.nextUrl.origin));
      }
    }
  } catch (err) {
    console.error('Erro ao buscar imagem do parceiro:', err);
    return new NextResponse('Erro no servidor', { status: 500 });
  }
}
