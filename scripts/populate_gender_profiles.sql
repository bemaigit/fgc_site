-- Script para popular o campo gender nos perfis existentes
-- Vamos atribuir gêneros aleatoriamente para demonstração
-- Em produção, você precisaria determinar o gênero real de cada atleta

-- Primeiro, verifica se existem perfis
SELECT COUNT(*) FROM "AthleteProfile";

-- Cria perfis para atletas que não têm
INSERT INTO "AthleteProfile" ("id", "athleteId", "createdAt", "updatedAt", "gender")
SELECT 
    gen_random_uuid(), 
    "id", 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP,
    CASE WHEN random() > 0.5 THEN 'MALE' ELSE 'FEMALE' END
FROM "Athlete" a
WHERE NOT EXISTS (
    SELECT 1 
    FROM "AthleteProfile" ap 
    WHERE ap."athleteId" = a."id"
);

-- Atualiza o gênero para os perfis existentes que ainda não têm gênero definido
UPDATE "AthleteProfile"
SET "gender" = CASE WHEN random() > 0.5 THEN 'MALE' ELSE 'FEMALE' END
WHERE "gender" IS NULL;
