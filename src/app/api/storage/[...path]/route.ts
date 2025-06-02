import { NextRequest } from 'next/server'
import { Client } from 'minio'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/')
    console.log(`Tentando acessar arquivo: ${path}`)
    
    // Configura o cliente MinIO
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost'
    const parsedEndpoint = endpoint.replace(/^https?:\/\//, '')
    
    const client = new Client({
      endPoint: parsedEndpoint,
      port: Number(process.env.MINIO_PORT || '9000'),
      useSSL: endpoint.startsWith('https'),
      accessKey: process.env.MINIO_ACCESS_KEY || '',
      secretKey: process.env.MINIO_SECRET_KEY || '',
    })

    // Cria um stream e busca o objeto
    const bucket = 'fgc' // Nome do bucket padrão
    console.log(`Buscando objeto: bucket=${bucket}, path=${path}`)
    
    // Busca o objeto do MinIO
    const objectStream = await client.getObject(bucket, path)
    
    // Obter informações sobre o objeto
    const stat = await client.statObject(bucket, path)
    console.log('Objeto encontrado:', {
      size: stat.size,
      contentType: stat.metaData['content-type']
    })
    
    // Converter stream para Buffer para uso na Response
    const chunks: Uint8Array[] = [];
    objectStream.on('data', (chunk) => chunks.push(chunk));
    
    // Usar Promise para aguardar o stream finalizar
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      objectStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
      objectStream.on('error', reject);
    });
    
    // Cria uma resposta com o buffer
    const response = new Response(buffer)
    
    // Define os headers corretos
    const contentType = stat.metaData['content-type'] || 'application/octet-stream'
    response.headers.set('Content-Type', contentType)
    response.headers.set('Cache-Control', 'public, max-age=31536000')
    
    return response
  } catch (error) {
    console.error('Erro ao buscar arquivo:', error)
    return new Response('Arquivo não encontrado', { status: 404 })
  }
}
