// Script para adicionar novos campos à tabela FiliationConfig
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateFiliationConfigTable() {
  try {
    console.log('Iniciando atualização da tabela FiliationConfig...');

    // Verificar se a tabela existe
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'FiliationConfig'
      );
    `;

    if (!tableExists[0].exists) {
      console.error('Tabela FiliationConfig não existe!');
      return;
    }

    // Verificar se o registro padrão existe
    const defaultConfig = await prisma.$queryRaw`
      SELECT * FROM "FiliationConfig" WHERE id = 'default-filiation';
    `;

    if (defaultConfig.length === 0) {
      console.error('Registro padrão não encontrado na tabela FiliationConfig!');
      return;
    }

    console.log('Registro padrão encontrado:', defaultConfig[0]);

    // Adicionar todos os novos campos usando SQL direto
    await prisma.$executeRaw`
      ALTER TABLE "FiliationConfig" 
      ADD COLUMN IF NOT EXISTS "prePaymentInstructions" TEXT,
      ADD COLUMN IF NOT EXISTS "termsAndConditions" TEXT,
      ADD COLUMN IF NOT EXISTS "documentationRequirements" JSONB,
      ADD COLUMN IF NOT EXISTS "paymentMethods" TEXT[] DEFAULT ARRAY['PIX', 'CREDIT_CARD', 'BOLETO']::TEXT[],
      ADD COLUMN IF NOT EXISTS "paymentGateways" TEXT[] DEFAULT ARRAY['MERCADOPAGO']::TEXT[],
      ADD COLUMN IF NOT EXISTS "notificationSettings" JSONB,
      ADD COLUMN IF NOT EXISTS "filiationPeriod" JSONB,
      ADD COLUMN IF NOT EXISTS "renewalInstructions" TEXT,
      ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS "faqContent" JSONB,
      ADD COLUMN IF NOT EXISTS "contactInfo" JSONB,
      ADD COLUMN IF NOT EXISTS "requiredFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
      ADD COLUMN IF NOT EXISTS "priceSettings" JSONB,
      ADD COLUMN IF NOT EXISTS "discountRules" JSONB,
      ADD COLUMN IF NOT EXISTS "documentValidityPeriod" INTEGER,
      ADD COLUMN IF NOT EXISTS "approvalWorkflow" JSONB;
    `;

    console.log('Campos adicionados com sucesso!');

    // Atualizar o registro padrão com valores iniciais para alguns campos
    await prisma.$executeRaw`
      UPDATE "FiliationConfig"
      SET 
        "prePaymentInstructions" = 'Preencha todos os campos do formulário e escolha as modalidades desejadas. Após o envio, você será redirecionado para a página de pagamento.',
        "termsAndConditions" = 'Ao se filiar à Federação Goiana de Ciclismo, o atleta concorda com os termos e condições estabelecidos no estatuto da entidade.',
        "documentationRequirements" = '{"identidade": "Documento de identidade com foto", "atestado": "Atestado médico com validade de até 6 meses", "foto": "Foto 3x4 recente para carteirinha"}',
        "filiationPeriod" = '{"startDate": "2025-01-01", "endDate": "2025-12-31"}',
        "isActive" = true,
        "contactInfo" = '{"email": "filiacao@fgc.org.br", "telefone": "(62) 99999-9999", "whatsapp": "(62) 99999-9999"}'
      WHERE id = 'default-filiation';
    `;

    console.log('Registro padrão atualizado com sucesso!');

    // Verificar se a atualização foi bem-sucedida
    const updatedConfig = await prisma.$queryRaw`
      SELECT * FROM "FiliationConfig" WHERE id = 'default-filiation';
    `;

    console.log('Configuração atualizada:', updatedConfig[0]);
    console.log('Atualização concluída com sucesso!');

  } catch (error) {
    console.error('Erro ao atualizar a tabela FiliationConfig:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateFiliationConfigTable()
  .then(() => console.log('Script finalizado.'))
  .catch(error => console.error('Erro na execução do script:', error));
