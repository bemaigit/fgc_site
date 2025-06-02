/*
  Warnings:

  - The primary key for the `_CategoryToNews` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_CategoryToNews` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "_CategoryToNews" DROP CONSTRAINT "_CategoryToNews_AB_pkey";

-- CreateTable
CREATE TABLE "HeaderConfig" (
    "id" TEXT NOT NULL,
    "logo" TEXT,
    "background" TEXT NOT NULL DEFAULT '#08285d',
    "hoverColor" TEXT NOT NULL DEFAULT '#177cc3',
    "textColor" TEXT NOT NULL DEFAULT '#ffffff',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeaderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeaderMenu" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "headerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeaderMenu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HeaderMenu_headerId_idx" ON "HeaderMenu"("headerId");

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryToNews_AB_unique" ON "_CategoryToNews"("A", "B");

-- AddForeignKey
ALTER TABLE "HeaderMenu" ADD CONSTRAINT "HeaderMenu_headerId_fkey" FOREIGN KEY ("headerId") REFERENCES "HeaderConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
