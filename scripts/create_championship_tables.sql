-- Script para criar novas tabelas para o sistema de Campeões Goianos
-- ATENÇÃO: Este script adiciona novas tabelas sem alterar as existentes

-- Verificar se as tabelas já existem e apenas criar se não existirem
DO $$
BEGIN
    -- 1. Tabela de Modalidades de Campeões
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ChampionModality') THEN
        CREATE TABLE IF NOT EXISTS "ChampionModality" (
            "id" TEXT PRIMARY KEY,
            "name" TEXT NOT NULL,
            "description" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        
        RAISE NOTICE 'Tabela ChampionModality criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela ChampionModality já existe';
    END IF;

    -- 2. Tabela de Categorias de Campeões
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ChampionCategory') THEN
        CREATE TABLE IF NOT EXISTS "ChampionCategory" (
            "id" TEXT PRIMARY KEY,
            "name" TEXT NOT NULL,
            "modalityId" TEXT NOT NULL,
            "description" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "ChampionCategory_modalityId_fkey" FOREIGN KEY ("modalityId") 
                REFERENCES "ChampionModality" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
        
        -- Índice para otimizar buscas por modalidade
        CREATE INDEX "ChampionCategory_modalityId_idx" ON "ChampionCategory"("modalityId");
        
        RAISE NOTICE 'Tabela ChampionCategory criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela ChampionCategory já existe';
    END IF;

    -- 3. Tabela de Eventos de Campeonato
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ChampionshipEvent') THEN
        CREATE TABLE IF NOT EXISTS "ChampionshipEvent" (
            "id" TEXT PRIMARY KEY,
            "name" TEXT NOT NULL,
            "year" INTEGER NOT NULL,
            "description" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Índice para otimizar buscas por ano
        CREATE INDEX "ChampionshipEvent_year_idx" ON "ChampionshipEvent"("year");
        
        RAISE NOTICE 'Tabela ChampionshipEvent criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela ChampionshipEvent já existe';
    END IF;
    
    -- 4. Criar a nova tabela de Campeões com as relações adequadas
    -- Obs: Manteremos a tabela Champion atual intacta e criaremos uma nova chamada ChampionEntry
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ChampionEntry') THEN
        CREATE TABLE IF NOT EXISTS "ChampionEntry" (
            "id" TEXT PRIMARY KEY,
            "athleteId" TEXT NOT NULL,
            "modalityId" TEXT NOT NULL,
            "categoryId" TEXT NOT NULL,
            "gender" TEXT NOT NULL,
            "position" INTEGER NOT NULL,
            "city" TEXT NOT NULL,
            "team" TEXT,
            "eventId" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            
            CONSTRAINT "ChampionEntry_athleteId_fkey" FOREIGN KEY ("athleteId") 
                REFERENCES "Athlete" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT "ChampionEntry_modalityId_fkey" FOREIGN KEY ("modalityId") 
                REFERENCES "ChampionModality" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT "ChampionEntry_categoryId_fkey" FOREIGN KEY ("categoryId") 
                REFERENCES "ChampionCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT "ChampionEntry_eventId_fkey" FOREIGN KEY ("eventId") 
                REFERENCES "ChampionshipEvent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );
        
        -- Índices para otimizar consultas
        CREATE INDEX "ChampionEntry_athleteId_idx" ON "ChampionEntry"("athleteId");
        CREATE INDEX "ChampionEntry_modality_category_gender_idx" ON "ChampionEntry"("modalityId", "categoryId", "gender");
        CREATE INDEX "ChampionEntry_eventId_idx" ON "ChampionEntry"("eventId");
        
        RAISE NOTICE 'Tabela ChampionEntry criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela ChampionEntry já existe';
    END IF;

END$$;

-- Se desejar, podemos adicionar dados iniciais para testes
-- Inserir algumas modalidades de exemplo
INSERT INTO "ChampionModality" ("id", "name", "description")
VALUES 
  ('mod_mtb', 'MTB', 'Mountain Bike'),
  ('mod_road', 'Road', 'Ciclismo de Estrada'),
  ('mod_track', 'Track', 'Ciclismo de Pista')
ON CONFLICT ("id") DO NOTHING;

-- Inserir algumas categorias de exemplo
INSERT INTO "ChampionCategory" ("id", "name", "modalityId", "description")
VALUES 
  ('cat_elite_mtb', 'Elite', 'mod_mtb', 'Elite Mountain Bike'),
  ('cat_sub23_mtb', 'Sub-23', 'mod_mtb', 'Sub-23 Mountain Bike'),
  ('cat_elite_road', 'Elite', 'mod_road', 'Elite Road'),
  ('cat_sub23_road', 'Sub-23', 'mod_road', 'Sub-23 Road')
ON CONFLICT ("id") DO NOTHING;

-- Inserir um evento de campeonato de exemplo
INSERT INTO "ChampionshipEvent" ("id", "name", "year", "description")
VALUES 
  ('event_2025', 'Campeonato Goiano 2025', 2025, 'Campeonato Goiano de Ciclismo 2025')
ON CONFLICT ("id") DO NOTHING;
