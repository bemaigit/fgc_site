-- Step 1: Remover as restrições de tipo enum das colunas em todas as tabelas
ALTER TABLE "PaymentTransaction" 
    ALTER COLUMN "paymentMethod" TYPE TEXT,
    ALTER COLUMN "status" TYPE TEXT;

ALTER TABLE "PaymentHistory"
    ALTER COLUMN "status" TYPE TEXT;

-- Step 2: Remover os tipos enum antigos
DROP TYPE IF EXISTS "PaymentMethod" CASCADE;
DROP TYPE IF EXISTS "PaymentStatus" CASCADE;

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

UPDATE "PaymentTransaction"
SET "status" = 'PENDING'
WHERE "status" NOT IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'REFUNDED', 'ERROR', 'PROCESSING', 'EXPIRED', 'PAID', 'FAILED');

UPDATE "PaymentHistory"
SET "status" = 'PENDING'
WHERE "status" NOT IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'REFUNDED', 'ERROR', 'PROCESSING', 'EXPIRED', 'PAID', 'FAILED');

-- Step 5: Converter as colunas para os novos tipos
ALTER TABLE "PaymentTransaction" 
    ALTER COLUMN "paymentMethod" TYPE "PaymentMethod" USING "paymentMethod"::"PaymentMethod",
    ALTER COLUMN "status" TYPE "PaymentStatus" USING "status"::"PaymentStatus";

ALTER TABLE "PaymentHistory"
    ALTER COLUMN "status" TYPE "PaymentStatus" USING "status"::"PaymentStatus";

-- Step 6: Criar a nova tabela Transaction se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Transaction') THEN
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
    END IF;
END $$;

-- Step 7: Criar índice se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'Transaction' 
        AND indexname = 'Transaction_paymentId_key'
    ) THEN
        CREATE UNIQUE INDEX "Transaction_paymentId_key" ON "Transaction"("paymentId");
    END IF;
END $$;
