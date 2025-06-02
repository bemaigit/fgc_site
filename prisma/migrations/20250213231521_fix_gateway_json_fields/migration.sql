/*
  Warnings:

  - Made the column `webhook` on table `PaymentGatewayConfig` required. This step will fail if there are existing NULL values in that column.
  - Made the column `urls` on table `PaymentGatewayConfig` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "PaymentGatewayConfig_priority_idx";

-- DropIndex
DROP INDEX "PaymentGatewayConfig_provider_active_idx";

-- AlterTable
ALTER TABLE "PaymentGatewayConfig" ALTER COLUMN "webhook" SET NOT NULL,
ALTER COLUMN "urls" SET NOT NULL,
ALTER COLUMN "credentials" DROP DEFAULT;
