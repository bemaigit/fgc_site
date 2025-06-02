// Script para criar um registro padrão na tabela FiliationConfig
const { PrismaClient } = require('@prisma/client');

// Cliente para o banco de dados principal
const prisma = new PrismaClient();

async function criarConfigPadrao() {
  try {
    console.log('Verificando se já existe um registro na tabela FiliationConfig...');
    
    const configExistente = await prisma.$queryRaw`
      SELECT * FROM "FiliationConfig" WHERE id = 'default-filiation'
    `;
    
    if (configExistente.length > 0) {
      console.log('Já existe um registro na tabela FiliationConfig. Nenhuma ação necessária.');
      return;
    }
    
    console.log('Criando registro padrão na tabela FiliationConfig...');
    
    await prisma.$executeRaw`
      INSERT INTO "FiliationConfig" (
        "id", "postPaymentInstructions", "updatedAt"
      ) VALUES (
        'default-filiation', 
        'Após o pagamento, envie os documentos necessários para completar sua filiação.', 
        CURRENT_TIMESTAMP
      )
    `;
    
    console.log('Registro padrão criado com sucesso!');
    
  } catch (error) {
    console.error('Erro ao criar registro padrão:', error);
  } finally {
    await prisma.$disconnect();
  }
}

criarConfigPadrao();
