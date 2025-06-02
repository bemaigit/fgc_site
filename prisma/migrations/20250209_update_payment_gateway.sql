-- Atualizar a tabela PaymentGatewayConfig
ALTER TABLE "PaymentGatewayConfig" 
  RENAME COLUMN "isActive" TO "active";

-- Remover colunas não utilizadas
ALTER TABLE "PaymentGatewayConfig" 
  DROP COLUMN IF EXISTS "priority",
  DROP COLUMN IF EXISTS "settings";

-- Garantir que as colunas obrigatórias existam
ALTER TABLE "PaymentGatewayConfig" 
  ALTER COLUMN "name" SET NOT NULL,
  ALTER COLUMN "provider" SET NOT NULL,
  ALTER COLUMN "credentials" SET NOT NULL,
  ALTER COLUMN "allowedMethods" SET NOT NULL,
  ALTER COLUMN "entityTypes" SET NOT NULL,
  ALTER COLUMN "createdBy" SET NOT NULL,
  ALTER COLUMN "updatedBy" SET NOT NULL;
