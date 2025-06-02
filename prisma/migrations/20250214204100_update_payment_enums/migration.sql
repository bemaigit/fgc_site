-- Atualizar registros existentes
UPDATE "PaymentTransaction"
SET "entityType" = 'ATHLETE_REGISTRATION'
WHERE "entityType" = 'ATHLETE';

UPDATE "PaymentTransaction"
SET "entityType" = 'CLUB_REGISTRATION'
WHERE "entityType" = 'CLUB';

UPDATE "PaymentTransaction"
SET "entityType" = 'EVENT_REGISTRATION'
WHERE "entityType" = 'EVENT';

-- Criar novo tipo enum
CREATE TYPE "PaymentEntityType_new" AS ENUM ('ATHLETE_REGISTRATION', 'CLUB_REGISTRATION', 'EVENT_REGISTRATION', 'MEMBERSHIP', 'OTHER');

-- Converter a coluna para o novo tipo
ALTER TABLE "PaymentTransaction" 
  ALTER COLUMN "entityType" TYPE "PaymentEntityType_new" 
  USING ("entityType"::text::"PaymentEntityType_new");

-- Remover o tipo antigo
DROP TYPE "PaymentEntityType";

-- Renomear o novo tipo
ALTER TYPE "PaymentEntityType_new" RENAME TO "PaymentEntityType";

-- Atualizar o enum PaymentProvider
ALTER TYPE "PaymentProvider" RENAME TO "PaymentProvider_old";
CREATE TYPE "PaymentProvider" AS ENUM ('MERCADO_PAGO', 'PAGSEGURO', 'ASAAS', 'PAGHIPER', 'INFINITE_PAY', 'APPMAX', 'PAGARME', 'YAMPI', 'GETNET');

-- Converter registros existentes
UPDATE "PaymentGatewayConfig"
SET "provider" = 'MERCADO_PAGO'
WHERE "provider" = 'MERCADOPAGO';

UPDATE "PaymentGatewayConfig"
SET "provider" = 'INFINITE_PAY'
WHERE "provider" = 'INFINITPAY';

-- Converter a coluna para o novo tipo
ALTER TABLE "PaymentGatewayConfig" 
  ALTER COLUMN "provider" TYPE "PaymentProvider" 
  USING ("provider"::text::"PaymentProvider");

-- Remover o tipo antigo
DROP TYPE "PaymentProvider_old";

-- Atualizar o enum PaymentStatus
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'APPROVED', 'REJECTED', 'CANCELLED', 'REFUNDED', 'ERROR', 'EXPIRED', 'PAID', 'FAILED');

-- Converter registros existentes
UPDATE "PaymentTransaction"
SET "status" = 'PAID'
WHERE "status" = 'APPROVED';

UPDATE "PaymentTransaction"
SET "status" = 'FAILED'
WHERE "status" = 'REJECTED';

UPDATE "PaymentTransaction"
SET "status" = 'FAILED'
WHERE "status" = 'EXPIRED';

UPDATE "PaymentTransaction"
SET "status" = 'FAILED'
WHERE "status" = 'ERROR';

-- Converter a coluna para o novo tipo
ALTER TABLE "PaymentTransaction" 
  ALTER COLUMN "status" TYPE "PaymentStatus" 
  USING ("status"::text::"PaymentStatus");

-- Remover o tipo antigo
DROP TYPE "PaymentStatus_old";

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('PIX', 'CREDIT_CARD', 'BOLETO');
ALTER TABLE "PaymentTransaction" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" USING ("paymentMethod"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "PaymentMethod_old";

-- AlterEnum
CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'REFUNDED', 'ERROR', 'PROCESSING', 'EXPIRED', 'PAID', 'FAILED');
ALTER TABLE "PaymentTransaction" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "PaymentStatus_old";
COMMIT;
