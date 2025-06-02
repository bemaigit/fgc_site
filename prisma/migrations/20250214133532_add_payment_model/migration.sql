/*
  Warnings:

  - You are about to drop the column `metadata` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `Payment` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - A unique constraint covering the columns `[externalId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `externalId` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentData` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Payment_provider_status_idx";

-- DropIndex
DROP INDEX "Payment_transactionId_idx";

-- DropIndex
DROP INDEX "Payment_transactionId_key";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "metadata",
DROP COLUMN "transactionId",
ADD COLUMN     "externalId" TEXT NOT NULL,
ADD COLUMN     "paymentData" JSONB NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "currency" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_externalId_key" ON "Payment"("externalId");

-- CreateIndex
CREATE INDEX "Payment_athleteId_idx" ON "Payment"("athleteId");

-- CreateIndex
CREATE INDEX "Payment_clubId_idx" ON "Payment"("clubId");

-- CreateIndex
CREATE INDEX "Payment_registrationId_idx" ON "Payment"("registrationId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");
