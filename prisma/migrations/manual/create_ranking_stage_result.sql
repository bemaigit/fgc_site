-- Criar a tabela RankingStageResult de forma segura
DO $$ 
BEGIN
    -- Verificar se a tabela já existe antes de criar
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'RankingStageResult') THEN
        CREATE TABLE "RankingStageResult" (
            "id" TEXT PRIMARY KEY,
            "rankingId" TEXT NOT NULL,
            "athleteId" TEXT NOT NULL,
            "modality" TEXT NOT NULL,
            "category" TEXT NOT NULL,
            "gender" TEXT NOT NULL,
            "stageName" TEXT NOT NULL,
            "position" INTEGER NOT NULL,
            "points" INTEGER NOT NULL,
            "season" INTEGER NOT NULL,
            "date" TIMESTAMP(3) NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            
            CONSTRAINT "RankingStageResult_rankingId_fkey" 
                FOREIGN KEY ("rankingId") 
                REFERENCES "Ranking"("id") 
                ON DELETE RESTRICT ON UPDATE CASCADE,
                
            CONSTRAINT "RankingStageResult_athleteId_fkey" 
                FOREIGN KEY ("athleteId") 
                REFERENCES "Athlete"("id") 
                ON DELETE RESTRICT ON UPDATE CASCADE
        );

        -- Criar índices para melhor performance
        CREATE INDEX "RankingStageResult_rankingId_idx" ON "RankingStageResult"("rankingId");
        CREATE INDEX "RankingStageResult_athleteId_idx" ON "RankingStageResult"("athleteId");
        CREATE INDEX "RankingStageResult_modality_category_gender_idx" 
            ON "RankingStageResult"("modality", "category", "gender");
        CREATE INDEX "RankingStageResult_season_idx" ON "RankingStageResult"("season");

        -- Log de sucesso
        RAISE NOTICE 'Tabela RankingStageResult criada com sucesso!';
    ELSE
        -- Log se a tabela já existir
        RAISE NOTICE 'Tabela RankingStageResult já existe.';
    END IF;
END $$;
