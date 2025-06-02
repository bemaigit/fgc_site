-- Migração segura para converter campos de string para enum nas tabelas de pagamento
-- Esta migração afeta APENAS as tabelas Payment e PaymentTransaction

-- Verificar se existem registros na tabela Payment antes de fazer alterações
DO $$ 
BEGIN
    -- Converter valores de string para enum no campo status da tabela Payment
    IF EXISTS (SELECT FROM "Payment" LIMIT 1) THEN
        -- Adicionar coluna temporária para o status como enum
        ALTER TABLE "Payment" 
        ADD COLUMN "status_enum" "PaymentStatus";

        -- Converter valores existentes para o enum correspondente
        UPDATE "Payment"
        SET "status_enum" = 
        CASE 
            WHEN "status" = 'PENDING' THEN 'PENDING'::"PaymentStatus"
            WHEN "status" = 'PROCESSING' THEN 'PROCESSING'::"PaymentStatus"
            WHEN "status" = 'PAID' THEN 'PAID'::"PaymentStatus"
            WHEN "status" = 'FAILED' THEN 'FAILED'::"PaymentStatus"
            WHEN "status" = 'REFUNDED' THEN 'REFUNDED'::"PaymentStatus"
            WHEN "status" = 'CANCELLED' THEN 'CANCELLED'::"PaymentStatus"
            ELSE 'PENDING'::"PaymentStatus"
        END;

        -- Converter valores de string para enum no campo paymentMethod
        ALTER TABLE "Payment" 
        ADD COLUMN "paymentMethod_enum" "PaymentMethod";

        UPDATE "Payment"
        SET "paymentMethod_enum" = 
        CASE 
            WHEN "paymentMethod" = 'CREDIT_CARD' THEN 'CREDIT_CARD'::"PaymentMethod"
            WHEN "paymentMethod" = 'DEBIT_CARD' THEN 'DEBIT_CARD'::"PaymentMethod"
            WHEN "paymentMethod" = 'BOLETO' THEN 'BOLETO'::"PaymentMethod"
            WHEN "paymentMethod" = 'PIX' THEN 'PIX'::"PaymentMethod"
            ELSE 'PIX'::"PaymentMethod"
        END;

        -- Substituir as colunas antigas pelas novas
        ALTER TABLE "Payment" 
        DROP COLUMN "status",
        DROP COLUMN "paymentMethod",
        ALTER COLUMN "status_enum" SET NOT NULL,
        ALTER COLUMN "paymentMethod_enum" SET NOT NULL,
        RENAME COLUMN "status_enum" TO "status",
        RENAME COLUMN "paymentMethod_enum" TO "paymentMethod";
        
        RAISE NOTICE 'Conversão de campos na tabela Payment concluída com sucesso.';
    ELSE
        RAISE NOTICE 'Tabela Payment está vazia. Nenhuma conversão necessária.';
    END IF;
    
    -- Adicionar campos específicos para pagamentos de eventos na tabela PaymentTransaction
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
