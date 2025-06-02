import { NextRequest, NextResponse } from 'next/server';
import { minioClient } from '@/lib/minio';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const path = searchParams.get('path');
    
    if (!path) {
      return new NextResponse('Parâmetro path é obrigatório', { status: 400 });
    }
    
    console.log(`[Sponsors Image Proxy] Buscando imagem no MinIO: ${path}`);
    
    // Determinar tipo de conteúdo com base na extensão
    let contentType = 'image/png'; // Padrão
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (path.endsWith('.webp')) {
      contentType = 'image/webp';
    } else if (path.endsWith('.svg')) {
      contentType = 'image/svg+xml';
    }
    
    try {
      // Usar a versão de stream do método getObject
      const fileStream = await minioClient.getObject(
        process.env.MINIO_BUCKET!,
        path
      );
      
      // Coletar os chunks de dados em um array de buffers
      const chunks: Buffer[] = [];
      
      // Processar a stream de dados
      for await (const chunk of fileStream) {
        chunks.push(chunk);
      }
      
      // Combinar todos os chunks em um único buffer
      const fileBuffer = Buffer.concat(chunks);
      
      console.log(`[Sponsors Image Proxy] Imagem carregada com sucesso: ${path}, tamanho: ${fileBuffer.length} bytes`);
      
      // Enviar resposta com o buffer da imagem
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch (error) {
      console.error(`[Sponsors Image Proxy] Erro ao buscar imagem ${path}:`, error);
      return new NextResponse('Erro ao carregar imagem', { status: 404 });
    }
  } catch (error) {
    console.error('[Sponsors Image Proxy] Erro interno:', error);
    return new NextResponse('Erro interno do servidor', { status: 500 });
  }
}
