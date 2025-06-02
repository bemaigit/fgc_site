-- AlterTable
ALTER TABLE "PaymentGatewayConfig" ALTER COLUMN "webhook" DROP NOT NULL,
ALTER COLUMN "webhook" DROP DEFAULT,
ALTER COLUMN "urls" DROP NOT NULL,
ALTER COLUMN "urls" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "PaymentGatewayConfig_provider_active_idx" ON "PaymentGatewayConfig"("provider", "active");

-- CreateIndex
CREATE INDEX "PaymentGatewayConfig_priority_idx" ON "PaymentGatewayConfig"("priority");
