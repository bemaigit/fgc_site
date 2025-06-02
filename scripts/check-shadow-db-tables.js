// Script para verificar se as tabelas do sistema de filiação existem no banco de dados de backup
const { PrismaClient } = require('@prisma/client');

// Criar um cliente Prisma que usa o banco de dados shadow
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.SHADOW_DATABASE_URL || "postgresql://fgc:fgc_password@localhost:5433/fgc_shadow"
    }
  }
});

async function checkTables() {
  try {
    console.log('Verificando tabelas do sistema de filiação no banco de dados de backup...');
    
    // Verificar se a tabela FiliationModality existe
    try {
      const modalidades = await prisma.$queryRaw`SELECT * FROM "FiliationModality" LIMIT 1`;
      console.log('Tabela FiliationModality existe:', modalidades);
    } catch (error) {
      console.error('Erro ao verificar tabela FiliationModality:', error.message);
    }
    
    // Verificar se a tabela FiliationCategory existe
    try {
      const categorias = await prisma.$queryRaw`SELECT * FROM "FiliationCategory" LIMIT 1`;
      console.log('Tabela FiliationCategory existe:', categorias);
    } catch (error) {
      console.error('Erro ao verificar tabela FiliationCategory:', error.message);
    }
    
    // Verificar se a tabela FiliationConfig existe
    try {
      const config = await prisma.$queryRaw`SELECT * FROM "FiliationConfig" LIMIT 1`;
      console.log('Tabela FiliationConfig existe:', config);
    } catch (error) {
      console.error('Erro ao verificar tabela FiliationConfig:', error.message);
    }
    
    // Listar todas as tabelas do banco de dados
    console.log('\nListando todas as tabelas do banco de dados de backup:');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('Tabelas encontradas:');
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('Erro ao verificar tabelas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
