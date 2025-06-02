-- Criar a tabela EventTopResult
CREATE TABLE "EventTopResult" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "userId" TEXT,
  "athleteName" TEXT NOT NULL,
  "clubId" TEXT,
  "clubName" TEXT,
  "result" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "EventTopResult_pkey" PRIMARY KEY ("id")
);

-- Criar índices para melhorar a performance
CREATE INDEX "EventTopResult_eventId_idx" ON "EventTopResult"("eventId");
CREATE INDEX "EventTopResult_categoryId_idx" ON "EventTopResult"("categoryId");
CREATE INDEX "EventTopResult_userId_idx" ON "EventTopResult"("userId");
CREATE INDEX "EventTopResult_clubId_idx" ON "EventTopResult"("clubId");

-- Adicionar chaves estrangeiras
ALTER TABLE "EventTopResult" ADD CONSTRAINT "EventTopResult_eventId_fkey" 
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EventTopResult" ADD CONSTRAINT "EventTopResult_categoryId_fkey" 
  FOREIGN KEY ("categoryId") REFERENCES "EventCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EventTopResult" ADD CONSTRAINT "EventTopResult_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EventTopResult" ADD CONSTRAINT "EventTopResult_clubId_fkey" 
  FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;
