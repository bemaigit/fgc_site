-- Criar tabela NewsImage
CREATE TABLE IF NOT EXISTS "NewsImage" (
  "id" TEXT NOT NULL,
  "newsId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "alt" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "NewsImage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NewsImage_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Criar índice para melhor performance nas queries
CREATE INDEX IF NOT EXISTS "NewsImage_newsId_idx" ON "NewsImage"("newsId");
