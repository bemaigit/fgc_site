-- Script para atualizar a tabela PasswordReset para incluir todos os campos do schema completo

-- Primeiro verifica se já existem essas colunas para evitar erros
DO $$
BEGIN
    -- Verificar e adicionar coluna userId se não existir
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                  WHERE table_name='PasswordReset' AND column_name='userId') THEN
        ALTER TABLE "PasswordReset" ADD COLUMN "userId" TEXT UNIQUE REFERENCES "User"("id") ON DELETE CASCADE;
    END IF;

    -- Verificar e adicionar coluna active se não existir
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                  WHERE table_name='PasswordReset' AND column_name='active') THEN
        ALTER TABLE "PasswordReset" ADD COLUMN "active" BOOLEAN DEFAULT TRUE;
    END IF;
    
    -- Verificar e adicionar coluna updatedAt se não existir
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns 
                  WHERE table_name='PasswordReset' AND column_name='updatedAt') THEN
        ALTER TABLE "PasswordReset" ADD COLUMN "updatedAt" TIMESTAMP(3);
    END IF;
    
    -- Renomear coluna 'expires' para 'expiresAt' se necessário
    IF EXISTS(SELECT 1 FROM information_schema.columns 
              WHERE table_name='PasswordReset' AND column_name='expires') 
    AND NOT EXISTS(SELECT 1 FROM information_schema.columns 
                  WHERE table_name='PasswordReset' AND column_name='expiresAt') THEN
        ALTER TABLE "PasswordReset" RENAME COLUMN "expires" TO "expiresAt";
    END IF;

    -- Criar índice para o token se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'PasswordReset' AND indexname = 'PasswordReset_token_idx') THEN
        CREATE INDEX "PasswordReset_token_idx" ON "PasswordReset"("token");
    END IF;
END$$;
