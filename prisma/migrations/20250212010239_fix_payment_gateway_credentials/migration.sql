/*
  Warnings:

  - Made the column `credentials` on table `PaymentGatewayConfig` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "FooterConfig" ALTER COLUMN "endereco" SET DEFAULT 'Rua XX, no XXX';

-- AlterTable
ALTER TABLE "PaymentGatewayConfig" ALTER COLUMN "credentials" SET NOT NULL,
ALTER COLUMN "credentials" SET DEFAULT '{}';
