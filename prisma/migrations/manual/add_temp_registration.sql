-- Verificar se a tabela TempRegistration já existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'TempRegistration') THEN
        -- Criar a tabela TempRegistration
        CREATE TABLE "TempRegistration" (
            "id" TEXT NOT NULL,
            "eventId" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "email" TEXT NOT NULL,
            "document" TEXT,
            "phone" TEXT,
            "birthDate" TIMESTAMP(3),
            "modalityId" TEXT NOT NULL,
            "categoryId" TEXT NOT NULL,
            "genderId" TEXT NOT NULL,
            "tierId" TEXT NOT NULL,
            "addressData" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "expiresAt" TIMESTAMP(3) NOT NULL,
            
            CONSTRAINT "TempRegistration_pkey" PRIMARY KEY ("id")
        );

        -- Adicionar índices para melhorar a performance
        CREATE INDEX "TempRegistration_eventId_idx" ON "TempRegistration"("eventId");
        CREATE INDEX "TempRegistration_expiresAt_idx" ON "TempRegistration"("expiresAt");
        
        -- Adicionar chave estrangeira para Event
        ALTER TABLE "TempRegistration" ADD CONSTRAINT "TempRegistration_eventId_fkey" 
            FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
            
        RAISE NOTICE 'Tabela TempRegistration criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela TempRegistration já existe, nenhuma ação necessária';
    END IF;
END
$$;
