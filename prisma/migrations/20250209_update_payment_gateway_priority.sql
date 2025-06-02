-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PaymentGatewayConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "allowedMethods" TEXT NOT NULL DEFAULT '[]',
    "entityTypes" TEXT NOT NULL DEFAULT '[]',
    "credentials" TEXT NOT NULL DEFAULT '{}',
    "webhookSecret" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PaymentGatewayConfig" ("id", "name", "provider", "active", "allowedMethods", "entityTypes", "credentials", "webhookSecret", "createdAt", "updatedAt") 
SELECT "id", "name", "provider", "active", "allowedMethods", "entityTypes", "credentials", "webhookSecret", "createdAt", "updatedAt" 
FROM "PaymentGatewayConfig";
DROP TABLE "PaymentGatewayConfig";
ALTER TABLE "new_PaymentGatewayConfig" RENAME TO "PaymentGatewayConfig";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;