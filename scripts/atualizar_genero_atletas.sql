-- Script para atualizar o gênero dos atletas com base no nome
-- Atletas com nome "Atleta Teste" serão configurados como masculino

-- Primeiro atualizamos todos os atletas com "Atleta Teste" para MALE
UPDATE "AthleteProfile"
SET gender = 'MALE'
FROM "Athlete" a
WHERE "AthleteProfile"."athleteId" = a.id
  AND a."fullName" LIKE 'Atleta Teste%';

-- Agora verificamos se existem nomes femininos específicos e os atualizamos
UPDATE "AthleteProfile"
SET gender = 'FEMALE'
FROM "Athlete" a
WHERE "AthleteProfile"."athleteId" = a.id
  AND (
    a."fullName" LIKE 'Ana %' OR
    a."fullName" LIKE 'Beatriz %' OR
    a."fullName" LIKE 'Carolina %' OR
    a."fullName" LIKE 'Daniela %' OR
    a."fullName" LIKE 'Fernanda %' OR
    a."fullName" LIKE 'Gabriela %' OR
    a."fullName" LIKE 'Helena %' OR
    a."fullName" LIKE 'Isabela %' OR
    a."fullName" LIKE 'Juliana %' OR
    a."fullName" LIKE 'Laura %' OR
    a."fullName" LIKE 'Mariana %' OR
    a."fullName" LIKE 'Natália %' OR
    a."fullName" LIKE 'Patricia %' OR
    a."fullName" LIKE 'Rafaela %' OR
    a."fullName" LIKE 'Sofia %' OR
    a."fullName" LIKE 'Tatiana %' OR
    a."fullName" LIKE 'Valentina %' OR
    a."fullName" LIKE 'Yasmin %'
  );

-- Mostrar estatísticas após atualização
SELECT gender, COUNT(*) FROM "AthleteProfile" GROUP BY gender;
