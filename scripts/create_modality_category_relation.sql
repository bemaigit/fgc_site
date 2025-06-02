-- Script para implementar a relação muitos-para-muitos entre modalidades e categorias
-- Criado em: 2025-04-05

-- 1. Criar backup das tabelas existentes
CREATE TABLE "EventCategory_backup" AS SELECT * FROM "EventCategory";

-- 2. Criar a nova tabela de junção
CREATE TABLE "EventModalityToCategory" (
  "modalityId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  
  CONSTRAINT "EventModalityToCategory_pkey" PRIMARY KEY ("modalityId", "categoryId")
);

-- 3. Criar índices para melhorar a performance
CREATE INDEX "EventModalityToCategory_categoryId_idx" ON "EventModalityToCategory"("categoryId");
CREATE INDEX "EventModalityToCategory_modalityId_idx" ON "EventModalityToCategory"("modalityId");

-- 4. Adicionar chaves estrangeiras
ALTER TABLE "EventModalityToCategory" ADD CONSTRAINT "EventModalityToCategory_modalityId_fkey" 
  FOREIGN KEY ("modalityId") REFERENCES "EventModality"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
ALTER TABLE "EventModalityToCategory" ADD CONSTRAINT "EventModalityToCategory_categoryId_fkey" 
  FOREIGN KEY ("categoryId") REFERENCES "EventCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Migrar os dados existentes para a nova estrutura
INSERT INTO "EventModalityToCategory" ("modalityId", "categoryId", "updatedAt")
SELECT "modalityId", "id", "updatedAt" FROM "EventCategory";

-- 6. Atualizar as referências na tabela ModalityCategoryGender
-- Não precisamos fazer nada, pois a tabela ModalityCategoryGender já tem referências diretas para modalityId e categoryId

-- 7. Remover a coluna modalityId da tabela EventCategory
-- IMPORTANTE: Primeiro remover as restrições de chave estrangeira
ALTER TABLE "EventCategory" DROP CONSTRAINT IF EXISTS "EventCategory_modalityId_fkey";

-- Agora podemos remover a coluna
ALTER TABLE "EventCategory" DROP COLUMN "modalityId";

-- Nota: Execute o comando prisma db pull após este script para atualizar o schema Prisma
