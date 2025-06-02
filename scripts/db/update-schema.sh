#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Iniciando atualização do schema...${NC}"

# Criar diretório temporário para os scripts SQL
mkdir -p tmp/sql

# Criar os scripts SQL
cat > tmp/sql/01_create_location_tables.sql << 'EOF'
DO $$ 
BEGIN
    -- Criar tabela Country se não existir
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'Country') THEN
        CREATE TABLE "Country" (
            "id" TEXT PRIMARY KEY,
            "name" TEXT NOT NULL,
            "code" TEXT UNIQUE NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL
        );
        CREATE INDEX "Country_code_idx" ON "Country"("code");
    END IF;

    -- Criar tabela State se não existir
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'State') THEN
        CREATE TABLE "State" (
            "id" TEXT PRIMARY KEY,
            "name" TEXT NOT NULL,
            "code" TEXT NOT NULL,
            "countryId" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL
        );
        CREATE INDEX "State_countryId_idx" ON "State"("countryId");
        ALTER TABLE "State" 
        ADD CONSTRAINT "State_countryId_fkey" 
        FOREIGN KEY ("countryId") REFERENCES "Country"("id");
    END IF;

    -- Criar tabela City se não existir
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'City') THEN
        CREATE TABLE "City" (
            "id" TEXT PRIMARY KEY,
            "name" TEXT NOT NULL,
            "stateId" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL
        );
        CREATE INDEX "City_stateId_idx" ON "City"("stateId");
        ALTER TABLE "City" 
        ADD CONSTRAINT "City_stateId_fkey" 
        FOREIGN KEY ("stateId") REFERENCES "State"("id");
    END IF;
END $$;
EOF

cat > tmp/sql/02_alter_event_table.sql << 'EOF'
DO $$ 
BEGIN
    -- Adicionar colunas de localização
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Event' AND column_name = 'countryId') THEN
        ALTER TABLE "Event" ADD COLUMN "countryId" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Event' AND column_name = 'stateId') THEN
        ALTER TABLE "Event" ADD COLUMN "stateId" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Event' AND column_name = 'cityId') THEN
        ALTER TABLE "Event" ADD COLUMN "cityId" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Event' AND column_name = 'addressDetails') THEN
        ALTER TABLE "Event" ADD COLUMN "addressDetails" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Event' AND column_name = 'zipCode') THEN
        ALTER TABLE "Event" ADD COLUMN "zipCode" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Event' AND column_name = 'latitude') THEN
        ALTER TABLE "Event" ADD COLUMN "latitude" DOUBLE PRECISION;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Event' AND column_name = 'longitude') THEN
        ALTER TABLE "Event" ADD COLUMN "longitude" DOUBLE PRECISION;
    END IF;

    -- Adicionar coluna de regulamento
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Event' AND column_name = 'regulationPdf') THEN
        ALTER TABLE "Event" ADD COLUMN "regulationPdf" TEXT;
    END IF;
END $$;
EOF

cat > tmp/sql/03_add_foreign_keys.sql << 'EOF'
DO $$ 
BEGIN
    -- Foreign key para Country
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Event_countryId_fkey'
    ) THEN
        ALTER TABLE "Event" 
        ADD CONSTRAINT "Event_countryId_fkey" 
        FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL;
    END IF;

    -- Foreign key para State
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Event_stateId_fkey'
    ) THEN
        ALTER TABLE "Event" 
        ADD CONSTRAINT "Event_stateId_fkey" 
        FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE SET NULL;
    END IF;

    -- Foreign key para City
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Event_cityId_fkey'
    ) THEN
        ALTER TABLE "Event" 
        ADD CONSTRAINT "Event_cityId_fkey" 
        FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL;
    END IF;
END $$;
EOF

cat > tmp/sql/04_seed_brazil.sql << 'EOF'
INSERT INTO "Country" ("id", "name", "code", "createdAt", "updatedAt")
SELECT 'BR', 'Brasil', 'BR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "Country" WHERE code = 'BR'
);
EOF

# Executar os scripts no container do postgres
for sql_file in tmp/sql/*.sql; do
    echo -e "${YELLOW}Executando ${sql_file}...${NC}"
    if docker-compose -f docker-compose.dev.yml exec -T postgres psql -U fgc -d fgc_dev -f - < "$sql_file"; then
        echo -e "${GREEN}✓ Script executado com sucesso: ${sql_file}${NC}"
    else
        echo -e "${RED}✗ Erro ao executar script: ${sql_file}${NC}"
        exit 1
    fi
done

# Limpar arquivos temporários
rm -rf tmp/sql

echo -e "${GREEN}Atualização do schema concluída com sucesso!${NC}"
