// Script para restaurar as tabelas de filiação do banco de backup para o banco principal
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

async function restaurarTabelasFiliacao() {
  try {
    console.log('Iniciando processo de restauração das tabelas de filiação...');
    
    // 1. Verificar se as tabelas já existem no banco principal
    console.log('Verificando se as tabelas já existem no banco principal...');
    const tabelasPrincipal = await prismaPrincipal.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('FiliationModality', 'FiliationCategory', 'FiliationConfig')
    `;
    
    if (tabelasPrincipal.length > 0) {
      console.log('ATENÇÃO: Algumas tabelas de filiação já existem no banco principal:');
      tabelasPrincipal.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
      console.log('Abortando operação para evitar conflitos. Por favor, verifique manualmente.');
      return;
    }
    
    // 2. Obter a estrutura das tabelas do banco de backup
    console.log('Obtendo estrutura das tabelas do banco de backup...');
    
    // 2.1 Obter estrutura da tabela FiliationModality
    const estruturaFiliationModality = await prismaBackup.$queryRaw`
      SELECT column_name, data_type, character_maximum_length, numeric_precision, numeric_scale, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'FiliationModality'
      ORDER BY ordinal_position
    `;
    
    // 2.2 Obter estrutura da tabela FiliationCategory
    const estruturaFiliationCategory = await prismaBackup.$queryRaw`
      SELECT column_name, data_type, character_maximum_length, numeric_precision, numeric_scale, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'FiliationCategory'
      ORDER BY ordinal_position
    `;
    
    // 2.3 Obter estrutura da tabela FiliationConfig
    const estruturaFiliationConfig = await prismaBackup.$queryRaw`
      SELECT column_name, data_type, character_maximum_length, numeric_precision, numeric_scale, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'FiliationConfig'
      ORDER BY ordinal_position
    `;
    
    // 3. Criar as tabelas no banco principal
    console.log('Criando tabelas no banco principal...');
    
    // 3.1 Criar tabela FiliationModality
    await prismaPrincipal.$executeRaw`
      CREATE TABLE "FiliationModality" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "price" DECIMAL(10,2) NOT NULL,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "order" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "createdBy" TEXT,
        "updatedBy" TEXT,
        CONSTRAINT "FiliationModality_pkey" PRIMARY KEY ("id")
      )
    `;
    
    // 3.2 Criar índice único para name em FiliationModality
    await prismaPrincipal.$executeRaw`
      CREATE UNIQUE INDEX "FiliationModality_name_key" ON "FiliationModality"("name")
    `;
    
    // 3.3 Criar tabela FiliationCategory
    await prismaPrincipal.$executeRaw`
      CREATE TABLE "FiliationCategory" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "order" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "createdBy" TEXT,
        "updatedBy" TEXT,
        CONSTRAINT "FiliationCategory_pkey" PRIMARY KEY ("id")
      )
    `;
    
    // 3.4 Criar índice único para name em FiliationCategory
    await prismaPrincipal.$executeRaw`
      CREATE UNIQUE INDEX "FiliationCategory_name_key" ON "FiliationCategory"("name")
    `;
    
    // 3.5 Criar tabela FiliationConfig
    await prismaPrincipal.$executeRaw`
      CREATE TABLE "FiliationConfig" (
        "id" TEXT NOT NULL DEFAULT 'default-filiation',
        "postPaymentInstructions" TEXT NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "updatedBy" TEXT,
        CONSTRAINT "FiliationConfig_pkey" PRIMARY KEY ("id")
      )
    `;
    
    // 4. Copiar os dados do banco de backup para o banco principal
    console.log('Copiando dados do banco de backup para o banco principal...');
    
    // 4.1 Obter dados da tabela FiliationModality
    const dadosFiliationModality = await prismaBackup.$queryRaw`
      SELECT * FROM "FiliationModality"
    `;
    
    // 4.2 Obter dados da tabela FiliationCategory
    const dadosFiliationCategory = await prismaBackup.$queryRaw`
      SELECT * FROM "FiliationCategory"
    `;
    
    // 4.3 Obter dados da tabela FiliationConfig
    const dadosFiliationConfig = await prismaBackup.$queryRaw`
      SELECT * FROM "FiliationConfig"
    `;
    
    // 4.4 Inserir dados na tabela FiliationModality
    console.log(`Inserindo ${dadosFiliationModality.length} registros na tabela FiliationModality...`);
    for (const modalidade of dadosFiliationModality) {
      await prismaPrincipal.$executeRaw`
        INSERT INTO "FiliationModality" (
          "id", "name", "price", "active", "order", "createdAt", "updatedAt", "createdBy", "updatedBy"
        ) VALUES (
          ${modalidade.id}, 
          ${modalidade.name}, 
          ${modalidade.price}, 
          ${modalidade.active}, 
          ${modalidade.order}, 
          ${modalidade.createdAt}, 
          ${modalidade.updatedAt}, 
          ${modalidade.createdBy}, 
          ${modalidade.updatedBy}
        )
      `;
    }
    
    // 4.5 Inserir dados na tabela FiliationCategory
    console.log(`Inserindo ${dadosFiliationCategory.length} registros na tabela FiliationCategory...`);
    for (const categoria of dadosFiliationCategory) {
      await prismaPrincipal.$executeRaw`
        INSERT INTO "FiliationCategory" (
          "id", "name", "active", "order", "createdAt", "updatedAt", "createdBy", "updatedBy"
        ) VALUES (
          ${categoria.id}, 
          ${categoria.name}, 
          ${categoria.active}, 
          ${categoria.order}, 
          ${categoria.createdAt}, 
          ${categoria.updatedAt}, 
          ${categoria.createdBy}, 
          ${categoria.updatedBy}
        )
      `;
    }
    
    // 4.6 Inserir dados na tabela FiliationConfig
    console.log(`Inserindo ${dadosFiliationConfig.length} registros na tabela FiliationConfig...`);
    for (const config of dadosFiliationConfig) {
      await prismaPrincipal.$executeRaw`
        INSERT INTO "FiliationConfig" (
          "id", "postPaymentInstructions", "updatedAt", "updatedBy"
        ) VALUES (
          ${config.id}, 
          ${config.postPaymentInstructions}, 
          ${config.updatedAt}, 
          ${config.updatedBy}
        )
      `;
    }
    
    console.log('Restauração das tabelas de filiação concluída com sucesso!');
    
  } catch (error) {
    console.error('Erro durante o processo de restauração:', error);
  } finally {
    await prismaPrincipal.$disconnect();
    await prismaBackup.$disconnect();
  }
}

restaurarTabelasFiliacao();
