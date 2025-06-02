// Script para testar a conexão com o MinIO
const { Client } = require('minio');
const fs = require('fs');
const path = require('path');

// Função para extrair a porta de uma URL
function extractPortFromUrl(url) {
  if (!url) return 9000;
  
  try {
    const urlObj = new URL(url);
    if (urlObj.port) {
      return parseInt(urlObj.port, 10);
    }
    return urlObj.protocol === 'https:' ? 443 : 80;
  } catch (e) {
    console.warn('URL inválida para MinIO, usando porta padrão 9000');
    return 9000;
  }
}

// Função para extrair domínio de uma URL
function extractDomainFromUrl(url) {
  if (!url) return 'localhost';
  
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return 'localhost';
  }
}

async function testMinioConnection() {
  // Configurações padrão
  let endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
  const accessKey = process.env.MINIO_ACCESS_KEY || 'fgc_admin';
  const secretKey = process.env.MINIO_SECRET_KEY || 'fgc_password';
  const bucket = process.env.MINIO_BUCKET || 'fgc';
  const region = process.env.MINIO_REGION || 'us-east-1';
  
  console.log('\n--- Teste de Conexão com MinIO ---');
  console.log(`Endpoint configurado: ${endpoint}`);
  
  // Tentar diferentes configurações de endpoint
  const endpointOptions = [
    endpoint,
    'http://localhost:9000',
    'http://minio:9000',
    'http://127.0.0.1:9000'
  ];
  
  // Remover duplicatas
  const uniqueEndpoints = [...new Set(endpointOptions)];
  
  for (const currentEndpoint of uniqueEndpoints) {
    console.log(`\nTestando endpoint: ${currentEndpoint}`);
    
    try {
      const minioClient = new Client({
        endPoint: extractDomainFromUrl(currentEndpoint),
        port: extractPortFromUrl(currentEndpoint),
        useSSL: currentEndpoint.startsWith('https:'),
        accessKey,
        secretKey,
        region
      });
      
      console.log('Cliente MinIO configurado com:');
      console.log({
        endPoint: extractDomainFromUrl(currentEndpoint),
        port: extractPortFromUrl(currentEndpoint),
        useSSL: currentEndpoint.startsWith('https:'),
        bucket
      });
      
      // Verificar se o bucket existe
      try {
        const bucketExists = await minioClient.bucketExists(bucket);
        console.log(`Bucket '${bucket}' existe? ${bucketExists ? 'SIM' : 'NÃO'}`);
        
        if (!bucketExists) {
          console.log(`[ERRO] O bucket '${bucket}' não existe.`);
          continue;
        }
        
        // Listar alguns objetos para verificar acesso
        console.log('\nListando primeiros 5 objetos no bucket:');
        const objectStream = minioClient.listObjects(bucket, '', true);
        let count = 0;
        const objects = [];
        
        for await (const obj of objectStream) {
          if (count++ < 5) {
            console.log(`- ${obj.name} (${Math.round(obj.size / 1024)} KB)`);
            objects.push(obj.name);
          } else {
            break;
          }
        }
        
        if (objects.length === 0) {
          console.log('Nenhum objeto encontrado no bucket.');
          continue;
        }
        
        // Tentar acessar um dos objetos listados
        if (objects.length > 0) {
          const testObject = objects[0];
          console.log(`\nTentando acessar o objeto: ${testObject}`);
          
          try {
            const fileStream = await minioClient.getObject(bucket, testObject);
            const chunks = [];
            
            for await (const chunk of fileStream) {
              chunks.push(chunk);
            }
            
            const fileBuffer = Buffer.concat(chunks);
            console.log(`[SUCESSO] Objeto lido com tamanho: ${Math.round(fileBuffer.length / 1024)} KB`);
            
            // Se chegou até aqui, o teste foi bem-sucedido
            console.log('\n✅ CONEXÃO BEM-SUCEDIDA!');
            console.log(`Configuração recomendada: MINIO_ENDPOINT=${currentEndpoint}`);
            
            // Tentar acessar um arquivo específico para banner
            const bannerFile = 'banners/banner-home.jpg';
            console.log(`\nTentando acessar arquivo de banner: ${bannerFile}`);
            
            try {
              const bannerStream = await minioClient.getObject(bucket, bannerFile);
              const bannerChunks = [];
              
              for await (const chunk of bannerStream) {
                bannerChunks.push(chunk);
              }
              
              const bannerBuffer = Buffer.concat(bannerChunks);
              console.log(`[SUCESSO] Banner encontrado com tamanho: ${Math.round(bannerBuffer.length / 1024)} KB`);
            } catch (bannerError) {
              console.log(`[FALHA] Erro ao acessar banner: ${bannerError.message}`);
            }
            
            return {
              success: true,
              endpoint: currentEndpoint,
              objects
            };
          } catch (objectError) {
            console.log(`[FALHA] Erro ao acessar objeto: ${objectError.message}`);
          }
        }
      } catch (bucketError) {
        console.log(`[FALHA] Erro ao verificar bucket: ${bucketError.message}`);
      }
    } catch (clientError) {
      console.log(`[FALHA] Erro ao criar cliente MinIO: ${clientError.message}`);
    }
  }
  
  console.log('\n❌ TODOS OS ENDPOINTS FALHARAM');
  return { success: false };
}

testMinioConnection()
  .then(result => {
    if (result.success) {
      console.log('\n=== RECOMENDAÇÕES ===');
      console.log(`1. Adicione ao seu .env.local:`);
      console.log(`   MINIO_ENDPOINT=${result.endpoint}`);
      console.log(`2. Reinicie o servidor Next.js`);
      console.log('3. Teste as APIs de imagem novamente');
    } else {
      console.log('\nVerifique se:');
      console.log('1. O contêiner MinIO está rodando');
      console.log('2. As credenciais (accessKey e secretKey) estão corretas');
      console.log('3. O nome do bucket está correto');
    }
  })
  .catch(error => {
    console.error('Erro no teste:', error);
  });
