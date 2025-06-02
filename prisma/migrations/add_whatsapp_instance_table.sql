-- Criar a tabela WhatsAppInstance
CREATE TABLE "WhatsAppInstance" (
    "id" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "connectionState" TEXT NOT NULL,
    "qrCode" TEXT,
    "qrCodeGeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "WhatsAppInstance_pkey" PRIMARY KEY ("id")
);

-- Criar índices para melhorar consultas comuns
CREATE UNIQUE INDEX "WhatsAppInstance_instanceName_key" ON "WhatsAppInstance"("instanceName");
CREATE INDEX "WhatsAppInstance_status_idx" ON "WhatsAppInstance"("status");
CREATE INDEX "WhatsAppInstance_connectionState_idx" ON "WhatsAppInstance"("connectionState");

-- Comentários para documentação
COMMENT ON TABLE "WhatsAppInstance" IS 'Armazena as instâncias do WhatsApp conectadas à Evolution API';
COMMENT ON COLUMN "WhatsAppInstance"."instanceName" IS 'Nome único da instância';
COMMENT ON COLUMN "WhatsAppInstance"."status" IS 'Status atual da instância (connected, disconnected, qrcode, etc)';
COMMENT ON COLUMN "WhatsAppInstance"."connectionState" IS 'Estado atual da conexão';
COMMENT ON COLUMN "WhatsAppInstance"."qrCode" IS 'Código QR para autenticação';
COMMENT ON COLUMN "WhatsAppInstance"."qrCodeGeneratedAt" IS 'Data/hora em que o QR Code foi gerado';
COMMENT ON COLUMN "WhatsAppInstance"."metadata" IS 'Metadados adicionais da instância';
