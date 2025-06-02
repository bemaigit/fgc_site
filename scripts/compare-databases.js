// Script para comparar as tabelas entre o banco de dados principal e o banco de dados de backup
const { PrismaClient } = require('@prisma/client');

// Cliente para o banco de dados principal
const prismaPrincipal = new PrismaClient();

// Cliente para o banco de dados de backup
const prismaBackup = new PrismaClient({
  datasources: {
    db: {
      url: process.env.SHADOW_DATABASE_URL || "postgresql://fgc:fgc_password@localhost:5433/fgc_shadow"
    }
  }
});

async function compareDatabases() {
  try {
    console.log('Comparando tabelas entre os bancos de dados...');
    
    // Listar todas as tabelas do banco de dados principal
    console.log('\nListando tabelas do banco de dados principal:');
    const tabelasPrincipal = await prismaPrincipal.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    const tabelasPrincipalSet = new Set();
    console.log('Tabelas encontradas no banco principal:');
    tabelasPrincipal.forEach(table => {
      tabelasPrincipalSet.add(table.table_name);
      console.log(`- ${table.table_name}`);
    });
    
    // Listar todas as tabelas do banco de dados de backup
    console.log('\nListando tabelas do banco de dados de backup:');
    const tabelasBackup = await prismaBackup.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    const tabelasBackupSet = new Set();
    console.log('Tabelas encontradas no banco de backup:');
    tabelasBackup.forEach(table => {
      tabelasBackupSet.add(table.table_name);
      console.log(`- ${table.table_name}`);
    });
    
    // Encontrar tabelas que existem no backup mas não no principal
    console.log('\nTabelas que existem no banco de backup mas não no banco principal:');
    const tabelasApenaNoBackup = [];
    tabelasBackup.forEach(table => {
      if (!tabelasPrincipalSet.has(table.table_name)) {
        tabelasApenaNoBackup.push(table.table_name);
        console.log(`- ${table.table_name}`);
      }
    });
    
    if (tabelasApenaNoBackup.length === 0) {
      console.log('Nenhuma tabela encontrada apenas no banco de backup.');
    }
    
    // Encontrar tabelas que existem no principal mas não no backup
    console.log('\nTabelas que existem no banco principal mas não no banco de backup:');
    const tabelasApenasNoPrincipal = [];
    tabelasPrincipal.forEach(table => {
      if (!tabelasBackupSet.has(table.table_name)) {
        tabelasApenasNoPrincipal.push(table.table_name);
        console.log(`- ${table.table_name}`);
      }
    });
    
    if (tabelasApenasNoPrincipal.length === 0) {
      console.log('Nenhuma tabela encontrada apenas no banco principal.');
    }
    
  } catch (error) {
    console.error('Erro ao comparar bancos de dados:', error);
  } finally {
    await prismaPrincipal.$disconnect();
    await prismaBackup.$disconnect();
  }
}

compareDatabases();
