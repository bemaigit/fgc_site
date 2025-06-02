// Script para verificar se as tabelas de filiação foram criadas corretamente no banco principal
const { PrismaClient } = require('@prisma/client');

// Cliente para o banco de dados principal
const prisma = new PrismaClient();

async function verificarTabelasFiliacao() {
  try {
    console.log('Verificando tabelas de filiação no banco de dados principal...');
    
    // Verificar se as tabelas existem
    const tabelas = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('FiliationModality', 'FiliationCategory', 'FiliationConfig')
      ORDER BY table_name
    `;
    
    console.log('Tabelas de filiação encontradas:');
    tabelas.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
    // Verificar estrutura da tabela FiliationModality
    console.log('\nEstrutura da tabela FiliationModality:');
    const colunasFiliationModality = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'FiliationModality'
      ORDER BY ordinal_position
    `;
    
    colunasFiliationModality.forEach(coluna => {
      console.log(`- ${coluna.column_name} (${coluna.data_type}, ${coluna.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
    });
    
    // Verificar estrutura da tabela FiliationCategory
    console.log('\nEstrutura da tabela FiliationCategory:');
    const colunasFiliationCategory = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'FiliationCategory'
      ORDER BY ordinal_position
    `;
    
    colunasFiliationCategory.forEach(coluna => {
      console.log(`- ${coluna.column_name} (${coluna.data_type}, ${coluna.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
    });
    
    // Verificar estrutura da tabela FiliationConfig
    console.log('\nEstrutura da tabela FiliationConfig:');
    const colunasFiliationConfig = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'FiliationConfig'
      ORDER BY ordinal_position
    `;
    
    colunasFiliationConfig.forEach(coluna => {
      console.log(`- ${coluna.column_name} (${coluna.data_type}, ${coluna.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
    });
    
  } catch (error) {
    console.error('Erro ao verificar tabelas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarTabelasFiliacao();
