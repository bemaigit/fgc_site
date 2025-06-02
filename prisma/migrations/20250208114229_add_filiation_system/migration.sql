-- CreateTable
CREATE TABLE "FiliationModality" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "FiliationModality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiliationCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "FiliationCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiliationConfig" (
    "id" TEXT NOT NULL DEFAULT 'default-filiation',
    "postPaymentInstructions" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "FiliationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FiliationModality_name_key" ON "FiliationModality"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FiliationCategory_name_key" ON "FiliationCategory"("name");
