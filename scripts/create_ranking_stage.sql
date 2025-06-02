-- Script para criar a tabela RankingStage
-- Este script pode ser executado diretamente no banco de dados PostgreSQL

-- Criar tabela de etapas de ranking
CREATE TABLE IF NOT EXISTS "RankingStage" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "location" TEXT,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "RankingStage_pkey" PRIMARY KEY ("id")
);

-- Comentário para confirmar execução
COMMENT ON TABLE "RankingStage" IS 'Tabela criada manualmente para armazenar etapas de ranking';
