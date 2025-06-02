// Script para listar todos os arquivos no MinIO
const { Client } = require('minio');

async function listMinioFiles() {
  try {
    // Configurar cliente MinIO
    const minioClient = new Client({
      endPoint: 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY || 'fgc_admin',
      secretKey: process.env.MINIO_SECRET_KEY || 'fgc_password',
      region: process.env.MINIO_REGION || 'us-east-1'
    });
    
    const bucket = process.env.MINIO_BUCKET || 'fgc';
    
    console.log(`\n=== Listando TODOS os arquivos no bucket '${bucket}' ===\n`);
    
    // Lista para armazenar todos os objetos
    const allObjects = [];
    
    // Listar todos os objetos
    const objectStream = minioClient.listObjects(bucket, '', true);
    
    for await (const obj of objectStream) {
      allObjects.push({
        name: obj.name,
        size: obj.size,
        lastModified: obj.lastModified
      });
    }
    
    // Organizar por diretórios
    const directoryMap = {};
    
    for (const obj of allObjects) {
      // Determinar o diretório principal
      const parts = obj.name.split('/');
      let mainDir = parts[0];
      
      if (!directoryMap[mainDir]) {
        directoryMap[mainDir] = [];
      }
      
      directoryMap[mainDir].push(obj);
    }
    
    // Exibir estrutura de diretórios
    console.log('Estrutura de diretórios encontrada:');
    
    Object.keys(directoryMap).sort().forEach(dir => {
      const files = directoryMap[dir];
      console.log(`\n[${dir}/] - ${files.length} arquivo(s)`);
      
      // Exibir os primeiros 5 arquivos de cada diretório
      files.slice(0, 5).forEach(file => {
        const size = Math.round(file.size / 1024);
        const date = file.lastModified.toISOString().split('T')[0];
        console.log(`  - ${file.name} (${size} KB) - ${date}`);
      });
      
      // Se houver mais arquivos, indicar isso
      if (files.length > 5) {
        console.log(`  - ... e mais ${files.length - 5} arquivo(s)`);
      }
    });
    
    // Resumo por tipo de arquivo
    console.log('\n=== Resumo por extensão de arquivo ===');
    const extensionMap = {};
    
    for (const obj of allObjects) {
      const ext = obj.name.split('.').pop().toLowerCase() || 'sem extensão';
      if (!extensionMap[ext]) {
        extensionMap[ext] = 0;
      }
      extensionMap[ext]++;
    }
    
    Object.keys(extensionMap).sort().forEach(ext => {
      console.log(`${ext}: ${extensionMap[ext]} arquivo(s)`);
    });
    
    console.log(`\nTotal: ${allObjects.length} arquivo(s) encontrado(s)`);
    
  } catch (error) {
    console.error('Erro ao listar arquivos:', error);
  }
}

listMinioFiles();
