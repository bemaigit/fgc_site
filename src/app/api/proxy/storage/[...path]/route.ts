import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'minio';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Helper para configuração do cliente MinIO
const getMinioClient = () => {
  const endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
  const parsedEndpoint = new URL(endpoint);

  return new Client({
    endPoint: parsedEndpoint.hostname,
    port: Number(parsedEndpoint.port) || 9000,
    useSSL: endpoint.startsWith('https'),
    accessKey: process.env.MINIO_ACCESS_KEY || '',
    secretKey: process.env.MINIO_SECRET_KEY || '',
    region: process.env.MINIO_REGION || 'us-east-1'
  });
};

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Extrai o caminho completo dos parâmetros
    const { path } = await params;
    const fullPath = path.join('/');
    
    // Verifica se o caminho está vazio
    if (!fullPath) {
      return NextResponse.json({ error: 'Caminho não especificado' }, { status: 400 });
    }

    console.log(`Proxy de storage solicitado para: ${fullPath}`);

    // Nome do bucket
    const bucket = process.env.MINIO_BUCKET || 'fgc';

    // Inicializa o cliente MinIO
    const minioClient = getMinioClient();

    try {
      // Verifica se o objeto existe
      await minioClient.statObject(bucket, fullPath);
    } catch (error) {
      console.error(`Arquivo não encontrado: ${bucket}/${fullPath}`, error);
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 });
    }

    try {
      // Obtém o objeto do MinIO
      const dataStream = await minioClient.getObject(bucket, fullPath);
      
      // Obtém metadados do objeto para determinar o Content-Type
      const stat = await minioClient.statObject(bucket, fullPath);
      
      // Extrai o tipo MIME a partir do nome do arquivo, se disponível
      let contentType = stat.metaData && stat.metaData['content-type'] 
        ? stat.metaData['content-type'] 
        : 'application/octet-stream';
      
      // Fallback baseado na extensão do arquivo
      if (contentType === 'application/octet-stream') {
        const fileExt = fullPath.split('.').pop()?.toLowerCase();
        if (fileExt) {
          const mimeTypes: Record<string, string> = {
            'pdf': 'application/pdf',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'zip': 'application/zip',
            'txt': 'text/plain',
            'csv': 'text/csv'
          };
          
          contentType = mimeTypes[fileExt] || contentType;
        }
      }
      
      // Extrai o nome original do arquivo, se disponível
      let fileName = fullPath.split('/').pop() || 'download';
      if (stat.metaData && stat.metaData['original-filename']) {
        fileName = stat.metaData['original-filename'];
      }
      
      // Determina se deve ser exibido inline ou como download (attachment)
      const disposition = request.nextUrl.searchParams.get('download') === 'true' 
        ? `attachment; filename="${encodeURIComponent(fileName)}"` 
        : `inline; filename="${encodeURIComponent(fileName)}"`;
      
      // Converte o stream em um array de bytes para passar para o NextResponse
      const chunks: Uint8Array[] = [];
      for await (const chunk of dataStream) {
        chunks.push(chunk);
      }
      
      // Concatena todos os chunks em um único buffer
      const fileBuffer = Buffer.concat(chunks);
      
      // Registra informações do download
      console.log(`Proxy entregando arquivo: ${bucket}/${fullPath}`, {
        contentType,
        disposition,
        size: fileBuffer.length
      });
      
      // Cria e retorna a resposta com os headers apropriados
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': disposition,
          'Cache-Control': 'public, max-age=86400',
          'Content-Length': String(fileBuffer.length)
        },
      });
    } catch (error) {
      console.error(`Erro ao processar arquivo: ${bucket}/${fullPath}`, error);
      return NextResponse.json(
        { error: 'Erro ao processar arquivo' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro no proxy de storage:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
