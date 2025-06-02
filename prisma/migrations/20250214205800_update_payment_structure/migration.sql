-- Step 1: Criar novos tipos enum com os valores atualizados
CREATE TYPE "PaymentMethod_new" AS ENUM ('PIX', 'CREDIT_CARD', 'BOLETO');
CREATE TYPE "PaymentStatus_new" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED',
    'REFUNDED',
    'ERROR',
    'PROCESSING',
    'EXPIRED',
    'PAID',
    'FAILED'
);

-- Step 2: Atualizar registros existentes para usar valores compatíveis
UPDATE "PaymentTransaction" 
SET "paymentMethod" = 'CREDIT_CARD'::text 
WHERE "paymentMethod" = 'DEBIT_CARD'::text;

-- Step 3: Alterar as colunas para usar os novos tipos
ALTER TABLE "PaymentTransaction" 
    ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" 
    USING ("paymentMethod"::text::"PaymentMethod_new"),
    ALTER COLUMN "status" TYPE "PaymentStatus_new" 
    USING ("status"::text::"PaymentStatus_new");

-- Step 4: Remover os tipos antigos
DROP TYPE "PaymentMethod";
DROP TYPE "PaymentStatus";

-- Step 5: Renomear os novos tipos
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";

-- Step 6: Criar a nova tabela Transaction
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "metadata" JSONB,
    "gatewayId" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- Step 7: Criar índices
CREATE UNIQUE INDEX "Transaction_paymentId_key" ON "Transaction"("paymentId");
