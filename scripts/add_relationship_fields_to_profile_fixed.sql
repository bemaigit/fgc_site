-- Remover as restrições de chave estrangeira que adicionamos antes (caso tenham sido criadas)
ALTER TABLE "AthleteProfile" DROP CONSTRAINT IF EXISTS "fk_athleteprofile_modality";
ALTER TABLE "AthleteProfile" DROP CONSTRAINT IF EXISTS "fk_athleteprofile_category";
ALTER TABLE "AthleteProfile" DROP CONSTRAINT IF EXISTS "fk_athleteprofile_gender";

-- Atualizar o genderId com base no mapeamento correto
UPDATE "AthleteProfile" 
SET "genderId" = 
  CASE 
    WHEN "gender" = 'MALE' THEN 'b4f82f14-79d6-4123-a29b-4d45ff890a52'  -- Masculino
    WHEN "gender" = 'FEMALE' THEN '7718a8b0-03f1-42af-a484-6176f8bf055e'  -- Feminino
    ELSE NULL
  END;

-- Mapeamento de modalidades para os IDs corretos
UPDATE "AthleteProfile" ap
SET "modalityId" = 
  CASE 
    WHEN (SELECT unnest("modalities") FROM "Athlete" WHERE "id" = ap."athleteId" LIMIT 1) = '00ef4e35-0e03-4387-ac8b-2e70a0ecef49' THEN 'cm7roc93s0002kja8p293o507'  -- Mountain Bike
    WHEN (SELECT unnest("modalities") FROM "Athlete" WHERE "id" = ap."athleteId" LIMIT 1) = '402e9e9d-3fd1-49c9-b6f4-12413801fb14' THEN 'cm7ro2ao80001kja8o4jdj323'  -- Ciclismo de Estrada
    WHEN (SELECT unnest("modalities") FROM "Athlete" WHERE "id" = ap."athleteId" LIMIT 1) = 'bcddde3d-45d3-4a6c-a098-df953056e0d1' THEN 'cm7rod87g0003kja83a2xjgwv'  -- BMX Racing
    ELSE NULL
  END;

-- Mapeamento de categorias para os IDs corretos
UPDATE "AthleteProfile" ap
SET "categoryId" = 
  CASE 
    WHEN (SELECT "category" FROM "Athlete" WHERE "id" = ap."athleteId") = 'a39295d3-69e2-4864-8c71-c5d3807af22' THEN 'cm7roxtzq0011kja8s7xxmq2n'  -- ELITE
    WHEN (SELECT "category" FROM "Athlete" WHERE "id" = ap."athleteId") LIKE '%JUNIOR%' THEN '3524e809-1524-4219-81dd-5a6459aa1894'  -- JUNIOR
    WHEN (SELECT "category" FROM "Athlete" WHERE "id" = ap."athleteId") LIKE '%SUB-23%' THEN '4e681273-544f-46ef-8105-9c33c3fac95e'  -- SUB-23
    WHEN (SELECT "category" FROM "Athlete" WHERE "id" = ap."athleteId") LIKE '%Master A%' THEN 'e9fb334c-f044-4cd0-818f-0a82f698c0ad'  -- Master A
    ELSE NULL
  END;

-- Agora adicionar as restrições de chave estrangeira
ALTER TABLE "AthleteProfile" 
ADD CONSTRAINT "fk_athleteprofile_modality" 
FOREIGN KEY ("modalityId") REFERENCES "EventModality"("id") ON DELETE SET NULL;

ALTER TABLE "AthleteProfile" 
ADD CONSTRAINT "fk_athleteprofile_category" 
FOREIGN KEY ("categoryId") REFERENCES "EventCategory"("id") ON DELETE SET NULL;

ALTER TABLE "AthleteProfile" 
ADD CONSTRAINT "fk_athleteprofile_gender" 
FOREIGN KEY ("genderId") REFERENCES "Gender"("id") ON DELETE SET NULL;
