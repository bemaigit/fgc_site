-- Adicionar a coluna gender à tabela AthleteProfile
ALTER TABLE "AthleteProfile" ADD COLUMN "gender" VARCHAR(10);

-- Criar um índice para melhorar a performance das consultas por gênero
CREATE INDEX "AthleteProfile_gender_idx" ON "AthleteProfile" ("gender");

-- Comentário para referência futura
COMMENT ON COLUMN "AthleteProfile"."gender" IS 'Gênero do atleta (MALE ou FEMALE)';

-- Script para atualizar perfis existentes (aleatoriamente para demonstração)
-- Em produção, você precisaria determinar o gênero real de cada atleta
UPDATE "AthleteProfile"
SET "gender" = CASE
  WHEN random() > 0.5 THEN 'MALE'
  ELSE 'FEMALE'
END
WHERE "gender" IS NULL;

-- Outra opção é adicionar um relacionamento com a tabela Gender
-- ALTER TABLE "AthleteProfile" ADD COLUMN "genderId" VARCHAR(255);
-- ALTER TABLE "AthleteProfile" ADD CONSTRAINT "AthleteProfile_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "Gender"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- CREATE INDEX "AthleteProfile_genderId_idx" ON "AthleteProfile" ("genderId");
