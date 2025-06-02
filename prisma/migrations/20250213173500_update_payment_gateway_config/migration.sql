-- DropForeignKey (temporário)
ALTER TABLE "PaymentTransaction" DROP CONSTRAINT IF EXISTS "PaymentTransaction_gatewayConfigId_fkey";

-- Recriar a tabela com a nova estrutura
DROP TABLE IF EXISTS "PaymentGatewayConfig";

CREATE TABLE "PaymentGatewayConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "allowedMethods" TEXT[] NOT NULL,
    "entityTypes" TEXT[] NOT NULL,
    "checkoutType" TEXT NOT NULL DEFAULT 'REDIRECT',
    "sandbox" BOOLEAN NOT NULL DEFAULT false,
    "webhook" JSONB DEFAULT '{"retryAttempts": 3, "retryInterval": 5000}',
    "urls" JSONB DEFAULT '{"success": "", "failure": "", "notification": ""}',
    "credentials" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "PaymentGatewayConfig_pkey" PRIMARY KEY ("id")
);

-- Criar índices
CREATE INDEX "PaymentGatewayConfig_provider_active_idx" ON "PaymentGatewayConfig"("provider", "active");
CREATE INDEX "PaymentGatewayConfig_priority_idx" ON "PaymentGatewayConfig"("priority");

-- Recriar Foreign Key
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_gatewayConfigId_fkey"
    FOREIGN KEY ("gatewayConfigId") REFERENCES "PaymentGatewayConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;
