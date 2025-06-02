-- Script para adicionar novos campos à tabela FiliationConfig

-- Adicionar todos os novos campos
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

-- Atualizar o registro padrão com valores iniciais para alguns campos
UPDATE "FiliationConfig"
SET 
  "prePaymentInstructions" = 'Preencha todos os campos do formulário e escolha as modalidades desejadas. Após o envio, você será redirecionado para a página de pagamento.',
  "termsAndConditions" = 'Ao se filiar à Federação Goiana de Ciclismo, o atleta concorda com os termos e condições estabelecidos no estatuto da entidade.',
  "documentationRequirements" = '{"identidade": "Documento de identidade com foto", "atestado": "Atestado médico com validade de até 6 meses", "foto": "Foto 3x4 recente para carteirinha"}',
  "filiationPeriod" = '{"startDate": "2025-01-01", "endDate": "2025-12-31"}',
  "isActive" = true,
  "contactInfo" = '{"email": "filiacao@fgc.org.br", "telefone": "(62) 99999-9999", "whatsapp": "(62) 99999-9999"}'
WHERE id = 'default-filiation';
