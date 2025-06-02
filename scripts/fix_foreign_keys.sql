-- Corrigir as restrições de chave estrangeira que falharam

-- Verificar se a constraint já existe antes de adicioná-la
DO $$
BEGIN
    -- Verificar FK_Athlete_Club
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_Athlete_Club' AND conrelid = 'public."Athlete"'::regclass
    ) THEN
        ALTER TABLE "Athlete" 
        ADD CONSTRAINT "FK_Athlete_Club" FOREIGN KEY ("clubId") 
        REFERENCES "Club"("id") ON DELETE SET NULL;
    END IF;
    
    -- Verificar FK_Athlete_RegisteredByUser
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'FK_Athlete_RegisteredByUser' AND conrelid = 'public."Athlete"'::regclass
    ) THEN
        ALTER TABLE "Athlete" 
        ADD CONSTRAINT "FK_Athlete_RegisteredByUser" FOREIGN KEY ("registeredByUserId") 
        REFERENCES "User"("id") ON DELETE SET NULL;
    END IF;
END
$$;
