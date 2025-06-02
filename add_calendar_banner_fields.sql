-- Adicionar campos para banner do calendário à tabela CalendarEvent
ALTER TABLE "CalendarEvent" 
ADD COLUMN IF NOT EXISTS "bannerUrl" TEXT,
ADD COLUMN IF NOT EXISTS "bannerFilename" TEXT,
ADD COLUMN IF NOT EXISTS "bannerTimestamp" BIGINT;

-- Criar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS "idx_calendar_event_banner_timestamp" ON "CalendarEvent" ("bannerTimestamp");

-- Adicionar comentários para documentação
COMMENT ON COLUMN "CalendarEvent"."bannerUrl" IS 'URL completa para o banner do calendário';
COMMENT ON COLUMN "CalendarEvent"."bannerFilename" IS 'Nome do arquivo do banner no MinIO';
COMMENT ON COLUMN "CalendarEvent"."bannerTimestamp" IS 'Timestamp de quando o banner foi atualizado';
