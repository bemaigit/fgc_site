import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const path = searchParams.get('path');

    if (!path) {
      console.error('Caminho do documento não fornecido');
      return new NextResponse('Caminho do documento não fornecido', { status: 400 });
    }

    console.log(`Processando requisição para documento: ${path}`);

    // Define o prefixo para a pasta de documentos no MinIO
    storageService.setPrefix('documentos');

    // Tenta obter o documento
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
      let contentType = 'application/octet-stream'; // Tipo padrão para download
      
      if (path.endsWith('.pdf')) {
        contentType = 'application/pdf';
      } else if (path.endsWith('.xlsx') || path.endsWith('.xls')) {
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (path.endsWith('.docx') || path.endsWith('.doc')) {
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (path.endsWith('.txt')) {
        contentType = 'text/plain';
      } else if (path.endsWith('.csv')) {
        contentType = 'text/csv';
      } else if (path.endsWith('.zip')) {
        contentType = 'application/zip';
      } else if (path.endsWith('.rar')) {
        contentType = 'application/x-rar-compressed';
      }

      // Obter nome do arquivo a partir do caminho
      const fileName = path.split('/').pop() || 'documento';

      // Configurar headers para download
      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
      headers.set('Content-Length', buffer.length.toString());
      
      // Adicionar cache headers
      headers.set('Cache-Control', 'public, max-age=31536000'); // 1 ano
      
      return new NextResponse(buffer, {
        status: 200,
        headers
      });
    } catch (error) {
      console.error(`[Proxy Documento] Erro ao obter documento ${path}:`, error);
      
      // Tentar novamente com caminho alternativo (sem prefixo)
      try {
        console.log(`[Proxy Documento] Tentando caminho alternativo para: ${path}`);
        storageService.setPrefix(''); // Sem prefixo
        
        const fileStream = await storageService.getFileStream(`documentos/${path}`);
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
        let contentType = 'application/octet-stream'; // Tipo padrão para download
        
        if (path.endsWith('.pdf')) {
          contentType = 'application/pdf';
        } else if (path.endsWith('.xlsx') || path.endsWith('.xls')) {
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else if (path.endsWith('.docx') || path.endsWith('.doc')) {
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else if (path.endsWith('.txt')) {
          contentType = 'text/plain';
        } else if (path.endsWith('.csv')) {
          contentType = 'text/csv';
        } else if (path.endsWith('.zip')) {
          contentType = 'application/zip';
        } else if (path.endsWith('.rar')) {
          contentType = 'application/x-rar-compressed';
        }
        
        // Obter nome do arquivo a partir do caminho
        const fileName = path.split('/').pop() || 'documento';
        
        // Configurar headers para download
        const headers = new Headers();
        headers.set('Content-Type', contentType);
        headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
        headers.set('Content-Length', buffer.length.toString());
        
        // Adicionar cache headers
        headers.set('Cache-Control', 'public, max-age=31536000'); // 1 ano
        
        return new NextResponse(buffer, {
          status: 200,
          headers
        });
      } catch (secondError) {
        console.error(`[Proxy Documento] Erro ao obter documento no caminho alternativo ${path}:`, secondError);
        return new NextResponse('Documento não encontrado', { status: 404 });
      }
    }
  } catch (error) {
    console.error('[Proxy Documento] Erro geral:', error);
    return new NextResponse('Erro ao processar documento', { status: 500 });
  }
}
