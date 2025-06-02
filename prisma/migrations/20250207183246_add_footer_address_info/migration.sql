-- AlterTable
ALTER TABLE "FooterConfig" ADD COLUMN     "cidade" TEXT DEFAULT 'Goiânia',
ADD COLUMN     "cnpj" TEXT DEFAULT 'XX.XXX.XXX/0001-XX',
ADD COLUMN     "endereco" TEXT DEFAULT 'Rua XX, nº XXX',
ADD COLUMN     "estado" TEXT DEFAULT 'GO';
