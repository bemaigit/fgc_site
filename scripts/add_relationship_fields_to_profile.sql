-- Script para adicionar campos de modalidade e categoria ao AthleteProfile com relacionamentos
ALTER TABLE "AthleteProfile" 
ADD COLUMN "modalityId" VARCHAR(255),
ADD COLUMN "categoryId" VARCHAR(255),
ADD COLUMN "genderId" VARCHAR(255);

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS "idx_athleteprofile_modalityid" ON "AthleteProfile"("modalityId");
CREATE INDEX IF NOT EXISTS "idx_athleteprofile_categoryid" ON "AthleteProfile"("categoryId");
CREATE INDEX IF NOT EXISTS "idx_athleteprofile_genderid" ON "AthleteProfile"("genderId");

-- Adicionar chaves estrangeiras
ALTER TABLE "AthleteProfile" 
ADD CONSTRAINT "fk_athleteprofile_modality" 
FOREIGN KEY ("modalityId") REFERENCES "EventModality"("id") ON DELETE SET NULL;

ALTER TABLE "AthleteProfile" 
ADD CONSTRAINT "fk_athleteprofile_category" 
FOREIGN KEY ("categoryId") REFERENCES "EventCategory"("id") ON DELETE SET NULL;

ALTER TABLE "AthleteProfile" 
ADD CONSTRAINT "fk_athleteprofile_gender" 
FOREIGN KEY ("genderId") REFERENCES "Gender"("id") ON DELETE SET NULL;

-- Atualizar valores do genderId com base no campo gender existente
UPDATE "AthleteProfile" 
SET "genderId" = (
  SELECT "id" FROM "Gender" WHERE "name" = 
    CASE 
      WHEN "AthleteProfile"."gender" = 'MALE' THEN 'Masculino'
      WHEN "AthleteProfile"."gender" = 'FEMALE' THEN 'Feminino'
      ELSE NULL
    END
);

-- Atualizar modalityId com base na primeira modalidade do atleta
UPDATE "AthleteProfile" ap
SET "modalityId" = (
  SELECT unnest("modalities") FROM "Athlete" WHERE "id" = ap."athleteId" LIMIT 1
);

-- Atualizar categoryId com base na categoria do atleta
UPDATE "AthleteProfile" ap
SET "categoryId" = (
  SELECT ec.id 
  FROM "EventCategory" ec 
  WHERE ec.name = (SELECT "category" FROM "Athlete" WHERE "id" = ap."athleteId")
  LIMIT 1
);
