/*
  Warnings:

  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - Made the column `logo` on table `HeaderConfig` required. This step will fail if there are existing NULL values in that column.
  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "HeaderConfig" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedBy" TEXT,
ALTER COLUMN "id" SET DEFAULT 'default-header',
ALTER COLUMN "logo" SET NOT NULL,
ALTER COLUMN "logo" SET DEFAULT '/images/logo-fgc.png';

-- AlterTable
ALTER TABLE "HeaderMenu" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "requireAuth" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "roles" TEXT[],
ADD COLUMN     "updatedBy" TEXT,
ALTER COLUMN "order" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ALTER COLUMN "password" SET NOT NULL;

-- CreateTable
CREATE TABLE "FooterConfig" (
    "id" TEXT NOT NULL DEFAULT 'default-footer',
    "logo" TEXT NOT NULL DEFAULT '/images/logo-fgc.png',
    "background" TEXT NOT NULL DEFAULT '#08285d',
    "hoverColor" TEXT NOT NULL DEFAULT '#177cc3',
    "textColor" TEXT NOT NULL DEFAULT '#ffffff',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "FooterConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FooterMenu" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requireAuth" BOOLEAN NOT NULL DEFAULT false,
    "roles" TEXT[],
    "footerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "FooterMenu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FooterMenu_footerId_idx" ON "FooterMenu"("footerId");

-- AddForeignKey
ALTER TABLE "FooterMenu" ADD CONSTRAINT "FooterMenu_footerId_fkey" FOREIGN KEY ("footerId") REFERENCES "FooterConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
