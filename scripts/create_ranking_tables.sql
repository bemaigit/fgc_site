-- Script para criar tabelas de modalidades e categorias de ranking
-- Este script pode ser executado diretamente no banco de dados PostgreSQL

-- Criar tabela de modalidades de ranking
CREATE TABLE IF NOT EXISTS "RankingModality" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "RankingModality_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RankingModality_name_key" UNIQUE ("name")
);

-- Criar tabela de categorias de ranking
CREATE TABLE IF NOT EXISTS "RankingCategory" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "modalityId" TEXT NOT NULL,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "RankingCategory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RankingCategory_name_modalityId_key" UNIQUE ("name", "modalityId")
);

-- Adicionar índice na coluna modalityId
CREATE INDEX IF NOT EXISTS "RankingCategory_modalityId_idx" ON "RankingCategory"("modalityId");

-- Adicionar chave estrangeira
ALTER TABLE "RankingCategory" 
ADD CONSTRAINT "RankingCategory_modalityId_fkey" 
FOREIGN KEY ("modalityId") 
REFERENCES "RankingModality"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Comentário para confirmar execução
COMMENT ON TABLE "RankingModality" IS 'Tabela criada manualmente para armazenar modalidades de ranking';
COMMENT ON TABLE "RankingCategory" IS 'Tabela criada manualmente para armazenar categorias de ranking';
