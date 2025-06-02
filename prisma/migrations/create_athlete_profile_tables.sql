-- Criação da tabela para perfil do atleta
CREATE TABLE "AthleteProfile" (
  "id" TEXT NOT NULL,
  "athleteId" TEXT NOT NULL,
  "biography" TEXT,
  "achievements" TEXT,
  "socialMedia" JSONB,
  "websiteUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AthleteProfile_pkey" PRIMARY KEY ("id")
);

-- Criação da tabela para galeria de fotos do atleta
CREATE TABLE "AthleteGallery" (
  "id" TEXT NOT NULL,
  "athleteId" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "title" TEXT,
  "description" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AthleteGallery_pkey" PRIMARY KEY ("id")
);

-- Criação da tabela para o banner da seção de atletas
CREATE TABLE "AthletesSectionBanner" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "description" TEXT,
  "imageUrl" TEXT NOT NULL,
  "ctaText" TEXT NOT NULL DEFAULT 'Conheça nossos Atletas',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "AthletesSectionBanner_pkey" PRIMARY KEY ("id")
);

-- Criação dos índices
CREATE UNIQUE INDEX "AthleteProfile_athleteId_key" ON "AthleteProfile"("athleteId");
CREATE INDEX "AthleteProfile_athleteId_idx" ON "AthleteProfile"("athleteId");
CREATE INDEX "AthleteGallery_athleteId_idx" ON "AthleteGallery"("athleteId");
CREATE INDEX "AthleteGallery_order_idx" ON "AthleteGallery"("order");

-- Criação das relações e constraints
ALTER TABLE "AthleteProfile" ADD CONSTRAINT "AthleteProfile_athleteId_fkey" 
  FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AthleteGallery" ADD CONSTRAINT "AthleteGallery_athleteId_fkey" 
  FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;
