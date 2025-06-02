-- Adiciona coluna parentId para criar hierarquia
ALTER TABLE "GalleryEvent" 
ADD COLUMN "parentId" TEXT;

-- Adiciona a referência própria para criar a hierarquia
ALTER TABLE "GalleryEvent"
ADD CONSTRAINT "GalleryEvent_parentId_fkey"
FOREIGN KEY ("parentId")
REFERENCES "GalleryEvent"("id")
ON DELETE CASCADE
ON UPDATE NO ACTION;

-- Adiciona índice para melhorar performance de busca
CREATE INDEX "GalleryEvent_parentId_idx" ON "GalleryEvent"("parentId");

-- Cria tipo para galeria
ALTER TABLE "GalleryEvent"
ADD COLUMN "type" TEXT CHECK ("type" IN ('EVENT', 'CATEGORY')) DEFAULT 'EVENT' NOT NULL;
