-- Add priority field
ALTER TABLE "PaymentGatewayConfig" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;

-- Update existing records
UPDATE "PaymentGatewayConfig" SET priority = 0 WHERE priority IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "PaymentGatewayConfig_provider_active_idx" ON "PaymentGatewayConfig"("provider", "active");
CREATE INDEX IF NOT EXISTS "PaymentGatewayConfig_priority_idx" ON "PaymentGatewayConfig"("priority");