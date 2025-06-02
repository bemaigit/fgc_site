/*
  Warnings:

  - You are about to drop the column `isActive` on the `PaymentGatewayConfig` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `PaymentGatewayConfig` table. All the data in the column will be lost.
  - You are about to drop the column `sandbox` on the `PaymentGatewayConfig` table. All the data in the column will be lost.
  - You are about to drop the column `settings` on the `PaymentGatewayConfig` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "PaymentGatewayConfig_isActive_idx";

-- DropIndex
DROP INDEX "PaymentGatewayConfig_provider_idx";

-- AlterTable
ALTER TABLE "PaymentGatewayConfig" DROP COLUMN "isActive",
DROP COLUMN "priority",
DROP COLUMN "sandbox",
DROP COLUMN "settings",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowedMethods" TEXT[],
ADD COLUMN     "entityTypes" TEXT[],
ALTER COLUMN "credentials" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "PaymentGatewayConfig_provider_active_idx" ON "PaymentGatewayConfig"("provider", "active");
