-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'BOLETO', 'PIX');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MERCADOPAGO', 'PAGSEGURO', 'ASAAS', 'PAGHIPER', 'INFINITPAY');

-- CreateEnum
CREATE TYPE "PaymentEntityType" AS ENUM ('ATHLETE', 'CLUB', 'EVENT', 'OTHER');

-- CreateTable
CREATE TABLE "PaymentGatewayConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "credentials" JSONB NOT NULL,
    "allowedMethods" "PaymentMethod"[],
    "priority" INTEGER NOT NULL DEFAULT 0,
    "settings" JSONB,
    "entityTypes" "PaymentEntityType"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "PaymentGatewayConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "gatewayConfigId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" "PaymentEntityType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentUrl" TEXT,
    "externalId" TEXT,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_system_config" (
    "id" TEXT NOT NULL DEFAULT 'payment-config',
    "notificationEmails" TEXT[],
    "successUrl" TEXT NOT NULL DEFAULT '/pagamento/sucesso',
    "failureUrl" TEXT NOT NULL DEFAULT '/pagamento/erro',
    "maxInstallments" INTEGER NOT NULL DEFAULT 12,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "payment_system_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentGatewayConfig_provider_isActive_idx" ON "PaymentGatewayConfig"("provider", "isActive");

-- CreateIndex
CREATE INDEX "PaymentGatewayConfig_allowedMethods_idx" ON "PaymentGatewayConfig"("allowedMethods");

-- CreateIndex
CREATE INDEX "PaymentTransaction_entityId_entityType_idx" ON "PaymentTransaction"("entityId", "entityType");

-- CreateIndex
CREATE INDEX "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");

-- CreateIndex
CREATE INDEX "PaymentTransaction_createdAt_idx" ON "PaymentTransaction"("createdAt");

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_gatewayConfigId_fkey" FOREIGN KEY ("gatewayConfigId") REFERENCES "PaymentGatewayConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
