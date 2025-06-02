import { NextRequest, NextResponse } from 'next/server';
import { minioClient } from '@/lib/minio';

export const runtime = 'nodejs';

// Headers CORS para permitir acesso de qualquer origem
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Rota OPTIONS para lidar com pre-flight requests CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      'Allow': 'GET, OPTIONS',
      'Content-Length': '0',
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const path = searchParams.get('path') || 'banners/banner-home.jpg'; // Caminho padrão para teste
    const bucket = process.env.MINIO_BUCKET || 'fgc';
    
    // Informações detalhadas para debug
    console.log('Configuração do MinIO:', {
      endpoint: process.env.MINIO_ENDPOINT,
      bucket,
      accessKey: process.env.MINIO_ACCESS_KEY ? '[definido]' : '[não definido]',
      secretKey: process.env.MINIO_SECRET_KEY ? '[definido]' : '[não definido]',
      path
    });
    
    try {
      // Verificar se o bucket existe
      const bucketExists = await minioClient.bucketExists(bucket);
      console.log(`Bucket '${bucket}' existe? ${bucketExists}`);
      
      if (!bucketExists) {
        return new NextResponse(
          JSON.stringify({ error: `Bucket '${bucket}' não encontrado` }), 
          { 
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      }
      
      // Tentar listar alguns objetos no bucket para debug
      console.log('Listando primeiros 5 objetos no bucket:');
      const objectStream = minioClient.listObjects(bucket, '', true);
      let count = 0;
      const objectList: string[] = [];
      
      // Collect and log the first 5 objects
      for await (const obj of objectStream) {
        if (count++ < 5) {
          console.log(`- ${obj.name}`);
          objectList.push(obj.name);
        } else {
          break;
        }
      }
      
      // Tentar obter o objeto solicitado
      console.log(`Tentando obter objeto: ${path}`);
      const fileStream = await minioClient.getObject(bucket, path);
      
      // Processar stream
      const chunks: Buffer[] = [];
      for await (const chunk of fileStream) {
        chunks.push(chunk);
      }
      
      // Combinar buffers
      const fileBuffer = Buffer.concat(chunks);
      const fileSizeKB = Math.round(fileBuffer.length / 1024);
      
      console.log(`Objeto encontrado com tamanho: ${fileSizeKB} KB`);
      
      // Determinar content-type baseado na extensão
      let contentType = 'application/octet-stream';
      if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
        contentType = 'image/jpeg';
      } else if (path.endsWith('.png')) {
        contentType = 'image/png';
      } else if (path.endsWith('.svg')) {
        contentType = 'image/svg+xml';
      } else if (path.endsWith('.webp')) {
        contentType = 'image/webp';
      } else if (path.endsWith('.gif')) {
        contentType = 'image/gif';
      } else if (path.endsWith('.pdf')) {
        contentType = 'application/pdf';
      }
      
      // Retornar o objeto com informações de debug no cabeçalho
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Length': fileBuffer.length.toString(),
          'X-Debug-Bucket': bucket,
          'X-Debug-Path': path,
          'X-Debug-Objects-Found': objectList.join(','),
          'Cache-Control': 'no-cache, no-store',
          ...corsHeaders
        }
      });
      
    } catch (error: any) {
      console.error(`Erro ao acessar MinIO:`, error);
      
      // Retornar erro detalhado
      return new NextResponse(
        JSON.stringify({
          error: 'Erro ao acessar MinIO',
          message: error.message,
          stack: error.stack,
          config: {
            endpoint: process.env.MINIO_ENDPOINT,
            bucket,
            path
          }
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }
  } catch (error: any) {
    console.error('Erro na API de teste:', error);
    
    return new NextResponse(
      JSON.stringify({ error: 'Erro interno', message: error.message }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
}
