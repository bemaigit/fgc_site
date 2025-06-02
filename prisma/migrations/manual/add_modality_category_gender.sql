-- Criar a nova tabela ModalityCategoryGender
CREATE TABLE "ModalityCategoryGender" (
  "id" TEXT NOT NULL,
  "modalityId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "genderId" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,

  CONSTRAINT "ModalityCategoryGender_pkey" PRIMARY KEY ("id")
);

-- Criar índices para melhorar a performance
CREATE INDEX "ModalityCategoryGender_modalityId_idx" ON "ModalityCategoryGender"("modalityId");
CREATE INDEX "ModalityCategoryGender_categoryId_idx" ON "ModalityCategoryGender"("categoryId");
CREATE INDEX "ModalityCategoryGender_genderId_idx" ON "ModalityCategoryGender"("genderId");

-- Criar restrição de unicidade para evitar duplicatas
CREATE UNIQUE INDEX "ModalityCategoryGender_modalityId_categoryId_genderId_key" ON "ModalityCategoryGender"("modalityId", "categoryId", "genderId");

-- Adicionar chaves estrangeiras
ALTER TABLE "ModalityCategoryGender" ADD CONSTRAINT "ModalityCategoryGender_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES "EventModality"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ModalityCategoryGender" ADD CONSTRAINT "ModalityCategoryGender_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "EventCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ModalityCategoryGender" ADD CONSTRAINT "ModalityCategoryGender_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "Gender"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Comentário para documentação
COMMENT ON TABLE "ModalityCategoryGender" IS 'Tabela de relacionamento triplo entre modalidades, categorias e gêneros para eventos';
