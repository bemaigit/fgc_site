-- CreateTable
CREATE TABLE "LegalDocuments" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "LegalDocuments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LegalDocuments_type_key" ON "LegalDocuments"("type");

-- Inserir documentos iniciais
INSERT INTO "LegalDocuments" ("id", "type", "title", "content", "createdAt", "updatedAt")
VALUES
  ('legal', 'legal', 'Informações Legais', 'Informações legais da Federação Goiana de Ciclismo...', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('privacy', 'privacy-policy', 'Política de Privacidade', 'A Federação Goiana de Ciclismo (FGC) está comprometida com a proteção da sua privacidade...', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('terms', 'terms-of-use', 'Termos de Uso', 'Bem-vindo aos Termos de Uso da Federação Goiana de Ciclismo (FGC)...', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lgpd', 'lgpd', 'LGPD', 'A Federação Goiana de Ciclismo está em conformidade com a Lei Geral de Proteção de Dados...', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
