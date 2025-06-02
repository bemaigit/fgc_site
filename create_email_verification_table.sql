-- Script para criar a tabela EmailVerification
CREATE TABLE IF NOT EXISTS "EmailVerification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EmailVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "EmailVerification_userId_key" UNIQUE ("userId"),
  CONSTRAINT "EmailVerification_token_key" UNIQUE ("token")
);

-- Criar índice para acelerar buscas por token
CREATE INDEX IF NOT EXISTS "EmailVerification_token_idx" ON "EmailVerification"("token");
