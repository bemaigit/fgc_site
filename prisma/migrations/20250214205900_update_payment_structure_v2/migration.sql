-- Step 1: Remover as restrições de tipo enum das colunas
ALTER TABLE "PaymentTransaction" 
    ALTER COLUMN "paymentMethod" TYPE TEXT,
    ALTER COLUMN "status" TYPE TEXT;

-- Step 2: Remover os tipos enum antigos
DROP TYPE IF EXISTS "PaymentMethod";
DROP TYPE IF EXISTS "PaymentStatus";

-- Step 3: Criar os novos tipos enum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CREDIT_CARD', 'BOLETO');
CREATE TYPE "PaymentStatus" AS ENUM (
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

-- Step 4: Atualizar registros existentes
UPDATE "PaymentTransaction" 
SET "paymentMethod" = 'CREDIT_CARD' 
WHERE "paymentMethod" = 'DEBIT_CARD';

-- Step 5: Converter as colunas para os novos tipos
ALTER TABLE "PaymentTransaction" 
    ALTER COLUMN "paymentMethod" TYPE "PaymentMethod" USING "paymentMethod"::"PaymentMethod",
    ALTER COLUMN "status" TYPE "PaymentStatus" USING "status"::"PaymentStatus";

-- Step 6: Criar a nova tabela Transaction
CREATE TABLE IF NOT EXISTS "Transaction" (
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
CREATE UNIQUE INDEX IF NOT EXISTS "Transaction_paymentId_key" ON "Transaction"("paymentId");
