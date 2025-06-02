-- Adicionar colunas para as referências
ALTER TABLE "RankingStageResult"
ADD COLUMN "modalityId" TEXT,
ADD COLUMN "categoryId" TEXT;

-- Adicionar as chaves estrangeiras
ALTER TABLE "RankingStageResult"
ADD CONSTRAINT "RankingStageResult_modalityId_fkey"
FOREIGN KEY ("modalityId") REFERENCES "EventModality"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RankingStageResult"
ADD CONSTRAINT "RankingStageResult_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "EventCategory"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Adicionar índices para melhor performance
CREATE INDEX "RankingStageResult_modalityId_idx" ON "RankingStageResult"("modalityId");
CREATE INDEX "RankingStageResult_categoryId_idx" ON "RankingStageResult"("categoryId");
