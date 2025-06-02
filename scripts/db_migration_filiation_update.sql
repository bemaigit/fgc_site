-- Script de migração para sistema de filiação - 02/04/2025
-- Este script implementa as alterações necessárias para o novo sistema de filiação

-- 1. Modificações na tabela Athlete
ALTER TABLE "Athlete" 
    ADD COLUMN IF NOT EXISTS "email" TEXT,
    ADD COLUMN IF NOT EXISTS "cbcRegistration" TEXT,
    ADD COLUMN IF NOT EXISTS "clubId" TEXT,
    ADD COLUMN IF NOT EXISTS "isIndividual" BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS "registrationYear" INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    ADD COLUMN IF NOT EXISTS "isRenewal" BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS "firstRegistrationDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS "currentRegistrationDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS "expirationDate" TIMESTAMP WITH TIME ZONE DEFAULT (MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, 12, 31)),
    ADD COLUMN IF NOT EXISTS "registeredByUserId" TEXT,
    ADD COLUMN IF NOT EXISTS "hasOwnAccount" BOOLEAN DEFAULT TRUE;

-- Drop unique constraint para permitir que um User registre múltiplos atletas
-- ATENÇÃO: Faça backup dos dados antes de executar esta operação se houver dados em produção
ALTER TABLE "Athlete" DROP CONSTRAINT IF EXISTS "Athlete_userId_key";

-- 2. Criar tabela para histórico de mudanças de status do atleta
CREATE TABLE IF NOT EXISTS "AthleteStatusHistory" (
    "id" TEXT PRIMARY KEY,
    "athleteId" TEXT NOT NULL,
    "previousClubId" TEXT,
    "newClubId" TEXT,
    "wasIndividual" BOOLEAN NOT NULL,
    "becameIndividual" BOOLEAN NOT NULL,
    "reason" TEXT,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT "FK_AthleteStatusHistory_Athlete" FOREIGN KEY ("athleteId") 
        REFERENCES "Athlete"("id") ON DELETE CASCADE,
    CONSTRAINT "FK_AthleteStatusHistory_PreviousClub" FOREIGN KEY ("previousClubId") 
        REFERENCES "Club"("id") ON DELETE SET NULL,
    CONSTRAINT "FK_AthleteStatusHistory_NewClub" FOREIGN KEY ("newClubId") 
        REFERENCES "Club"("id") ON DELETE SET NULL,
    CONSTRAINT "FK_AthleteStatusHistory_Payment" FOREIGN KEY ("paymentId") 
        REFERENCES "Payment"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "IDX_AthleteStatusHistory_athleteId" ON "AthleteStatusHistory"("athleteId");
CREATE INDEX IF NOT EXISTS "IDX_AthleteStatusHistory_previousClubId" ON "AthleteStatusHistory"("previousClubId");
CREATE INDEX IF NOT EXISTS "IDX_AthleteStatusHistory_newClubId" ON "AthleteStatusHistory"("newClubId");
CREATE INDEX IF NOT EXISTS "IDX_AthleteStatusHistory_createdAt" ON "AthleteStatusHistory"("createdAt");

-- 3. Adicionar FK entre Athlete e Club
ALTER TABLE "Athlete" 
    ADD CONSTRAINT IF NOT EXISTS "FK_Athlete_Club" FOREIGN KEY ("clubId") 
    REFERENCES "Club"("id") ON DELETE SET NULL;

-- 4. Adicionar FK entre Athlete e User (dirigente que registrou)
ALTER TABLE "Athlete" 
    ADD CONSTRAINT IF NOT EXISTS "FK_Athlete_RegisteredByUser" FOREIGN KEY ("registeredByUserId") 
    REFERENCES "User"("id") ON DELETE SET NULL;

-- 5. Modificações na tabela User para suportar dirigentes
ALTER TABLE "User" 
    ADD COLUMN IF NOT EXISTS "isManager" BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS "managedClubId" TEXT;

-- 6. Criar tabela de configuração por ano
CREATE TABLE IF NOT EXISTS "FiliationAnnualConfig" (
    "id" TEXT PRIMARY KEY,
    "year" INTEGER NOT NULL UNIQUE,
    "initialFilingFee" DECIMAL(10,2) NOT NULL DEFAULT 100.00,
    "renewalFee" DECIMAL(10,2) NOT NULL DEFAULT 80.00,
    "clubChangeStatusFee" DECIMAL(10,2) NOT NULL DEFAULT 50.00,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "createdBy" TEXT,
    "updatedBy" TEXT
);

-- Configuração padrão para o ano atual
INSERT INTO "FiliationAnnualConfig" ("id", "year", "initialFilingFee", "renewalFee", "clubChangeStatusFee", "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, 100.00, 80.00, 50.00, TRUE, NOW(), NOW())
ON CONFLICT ("year") DO NOTHING;

-- 7. Modificação no tipo de entidade
ALTER TYPE "PaymentEntityType" ADD VALUE IF NOT EXISTS 'CLUB_CHANGE' AFTER 'EVENT_REGISTRATION';

-- 8. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS "IDX_Athlete_clubId" ON "Athlete"("clubId");
CREATE INDEX IF NOT EXISTS "IDX_Athlete_registeredByUserId" ON "Athlete"("registeredByUserId");
CREATE INDEX IF NOT EXISTS "IDX_Athlete_registrationYear" ON "Athlete"("registrationYear");
CREATE INDEX IF NOT EXISTS "IDX_Athlete_expirationDate" ON "Athlete"("expirationDate");
