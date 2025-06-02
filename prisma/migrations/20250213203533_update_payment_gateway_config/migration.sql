-- DropForeignKey
ALTER TABLE "PaymentTransaction" DROP CONSTRAINT "PaymentTransaction_gatewayConfigId_fkey";

-- AlterTable
ALTER TABLE "PaymentGatewayConfig" ALTER COLUMN "webhook" SET DEFAULT '{}',
ALTER COLUMN "urls" SET DEFAULT '{}';

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_gatewayConfigId_fkey" FOREIGN KEY ("gatewayConfigId") REFERENCES "PaymentGatewayConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
