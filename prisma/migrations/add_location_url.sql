-- Adiciona o campo locationUrl à tabela Event
ALTER TABLE "Event" ADD COLUMN "locationUrl" TEXT;

-- Comentário para documentar a alteração
COMMENT ON COLUMN "Event"."locationUrl" IS 'URL do Google Maps para a localização do evento';
