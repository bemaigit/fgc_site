import { S3Client, CreateBucketCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'fgc_admin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'fgc_password'
  },
  forcePathStyle: true
});

async function setupLogoBucket() {
  try {
    // Criar bucket para logos
    await s3Client.send(new CreateBucketCommand({
      Bucket: 'logos'
    }));

    // Configurar política de acesso público para leitura
    const bucketPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicRead',
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: ['arn:aws:s3:::logos/*']
        }
      ]
    };

    await s3Client.send(new PutBucketPolicyCommand({
      Bucket: 'logos',
      Policy: JSON.stringify(bucketPolicy)
    }));

    console.log('Bucket de logos criado e configurado com sucesso!');
  } catch (error: any) {
    if (error?.name === 'BucketAlreadyExists') {
      console.log('Bucket de logos já existe.');
    } else {
      console.error('Erro ao configurar bucket de logos:', error);
    }
  }
}

setupLogoBucket();
