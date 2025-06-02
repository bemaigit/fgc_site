import { Client } from 'minio'

async function testMinioConnection() {
  console.log('Testando conexão com Minio...')
  
  const minioClient = new Client({
    endPoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: '3ivcAYib66FxKIC4BXzm',
    secretKey: 'tbGVkjYt8o3lNoEVTQsQTfhXNSOxlGe4fLbS1MQo'
  })

  try {
    // Testa se o bucket existe
    const bucket = 'fgc/banner'
    console.log(`Verificando se o bucket ${bucket} existe...`)
    const exists = await minioClient.bucketExists(bucket)
    console.log(`Bucket ${bucket} existe:`, exists)

    if (!exists) {
      console.log(`Criando bucket ${bucket}...`)
      await minioClient.makeBucket(bucket, 'us-east-1')
      console.log('Bucket criado com sucesso')

      // Define política pública para o bucket
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucket}/*`],
          },
        ],
      }
      await minioClient.setBucketPolicy(bucket, JSON.stringify(policy))
      console.log('Política do bucket configurada com sucesso')
    }

    // Lista os objetos no bucket
    console.log('Listando objetos no bucket...')
    const stream = minioClient.listObjects(bucket)
    const objects: string[] = []

    await new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        if (obj.name) objects.push(obj.name)
      })
      stream.on('end', resolve)
      stream.on('error', reject)
    })

    console.log('Objetos no bucket:', objects)
    console.log('Teste concluído com sucesso!')
  } catch (error) {
    console.error('Erro ao testar conexão:', error)
  }
}

testMinioConnection().catch(console.error)