-- Criar a tabela PaymentGatewayConfig se ela não existir
CREATE TABLE IF NOT EXISTS "PaymentGatewayConfig" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "credentials" JSONB NOT NULL,
  "allowedMethods" TEXT[] NOT NULL,
  "entityTypes" TEXT[] NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT NOT NULL,

  CONSTRAINT "PaymentGatewayConfig_pkey" PRIMARY KEY ("id")
);
