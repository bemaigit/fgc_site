-- Script para adicionar a tabela ClubFeeSettings ao banco de dados
-- Executar diretamente no PostgreSQL

-- Verifica se a tabela já existe e cria apenas se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ClubFeeSettings') THEN
        -- Cria a tabela ClubFeeSettings
        CREATE TABLE "ClubFeeSettings" (
            "id" TEXT PRIMARY KEY,
            "newRegistrationFee" DECIMAL(10, 2) NOT NULL,
            "annualRenewalFee" DECIMAL(10, 2) NOT NULL,
            "active" BOOLEAN NOT NULL DEFAULT TRUE,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL
        );

        -- Insere um registro inicial com valores padrão
        INSERT INTO "ClubFeeSettings" (
            "id", 
            "newRegistrationFee", 
            "annualRenewalFee", 
            "active", 
            "createdAt", 
            "updatedAt"
        )
        VALUES (
            'default-club-fee-settings', 
            200.00, -- Valor padrão para nova filiação (R$ 200,00)
            150.00, -- Valor padrão para renovação (R$ 150,00)
            TRUE, 
            CURRENT_TIMESTAMP, 
            CURRENT_TIMESTAMP
        );

        RAISE NOTICE 'Tabela ClubFeeSettings criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela ClubFeeSettings já existe.';
    END IF;
END
$$;
