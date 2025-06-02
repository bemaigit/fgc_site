-- Migração segura para o sistema de pagamento
-- Esta migração afeta APENAS as tabelas relacionadas ao sistema de pagamento

-- 1. Adicionar o valor ATHLETE_REGISTRATION ao enum PaymentEntityType
DO $$ 
BEGIN
    -- Verificar se o tipo já existe
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentEntityType') THEN
        -- Verificar se o valor já existe no enum
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentEntityType')
            AND enumlabel = 'ATHLETE_REGISTRATION'
        ) THEN
            -- Adicionar o valor ao enum
            ALTER TYPE "PaymentEntityType" ADD VALUE IF NOT EXISTS 'ATHLETE_REGISTRATION';
            RAISE NOTICE 'Valor ATHLETE_REGISTRATION adicionado ao enum PaymentEntityType.';
        ELSE
            RAISE NOTICE 'Valor ATHLETE_REGISTRATION já existe no enum PaymentEntityType.';
        END IF;
    ELSE
        RAISE NOTICE 'Tipo PaymentEntityType não encontrado.';
    END IF;
END $$;

-- 2. Adicionar campos específicos para pagamentos de eventos na tabela PaymentTransaction
DO $$ 
BEGIN
    -- Verificar se as colunas já existem antes de adicioná-las
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PaymentTransaction' AND column_name = 'qrCode') THEN
        ALTER TABLE "PaymentTransaction" ADD COLUMN "qrCode" TEXT;
        RAISE NOTICE 'Campo qrCode adicionado à tabela PaymentTransaction.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PaymentTransaction' AND column_name = 'qrCodeBase64') THEN
        ALTER TABLE "PaymentTransaction" ADD COLUMN "qrCodeBase64" TEXT;
        RAISE NOTICE 'Campo qrCodeBase64 adicionado à tabela PaymentTransaction.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PaymentTransaction' AND column_name = 'barcodeNumber') THEN
        ALTER TABLE "PaymentTransaction" ADD COLUMN "barcodeNumber" TEXT;
        RAISE NOTICE 'Campo barcodeNumber adicionado à tabela PaymentTransaction.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PaymentTransaction' AND column_name = 'installments') THEN
        ALTER TABLE "PaymentTransaction" ADD COLUMN "installments" INTEGER;
        RAISE NOTICE 'Campo installments adicionado à tabela PaymentTransaction.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PaymentTransaction' AND column_name = 'registrationId') THEN
        ALTER TABLE "PaymentTransaction" ADD COLUMN "registrationId" TEXT;
        RAISE NOTICE 'Campo registrationId adicionado à tabela PaymentTransaction.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PaymentTransaction' AND column_name = 'notificationSent') THEN
        ALTER TABLE "PaymentTransaction" ADD COLUMN "notificationSent" BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Campo notificationSent adicionado à tabela PaymentTransaction.';
    END IF;
    
    -- Adicionar índice para o campo registrationId se ele não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'PaymentTransaction' 
        AND indexname = 'PaymentTransaction_registrationId_idx'
    ) THEN
        CREATE INDEX "PaymentTransaction_registrationId_idx" ON "PaymentTransaction"("registrationId");
        RAISE NOTICE 'Índice para registrationId adicionado à tabela PaymentTransaction.';
    END IF;
    
    -- Adicionar chave estrangeira para Registration se ela não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'PaymentTransaction_registrationId_fkey' 
        AND table_name = 'PaymentTransaction'
    ) THEN
        ALTER TABLE "PaymentTransaction" 
        ADD CONSTRAINT "PaymentTransaction_registrationId_fkey" 
        FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE 'Chave estrangeira para Registration adicionada à tabela PaymentTransaction.';
    END IF;
END $$;
