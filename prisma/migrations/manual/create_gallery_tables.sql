-- Criar tabela de eventos da galeria
CREATE TABLE IF NOT EXISTS "GalleryEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "modality" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "date" TIMESTAMP NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "GalleryEvent_slug_key" UNIQUE ("slug")
);

-- Criar tabela de imagens da galeria
CREATE TABLE IF NOT EXISTS "GalleryImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "GalleryImage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "GalleryEvent"("id") ON DELETE CASCADE
);

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS "GalleryEvent_modality_category_idx" ON "GalleryEvent"("modality", "category");
CREATE INDEX IF NOT EXISTS "GalleryImage_eventId_idx" ON "GalleryImage"("eventId");
