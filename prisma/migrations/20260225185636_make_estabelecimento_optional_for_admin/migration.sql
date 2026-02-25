-- DropForeignKey
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_estabelecimentoId_fkey";

-- AlterTable
ALTER TABLE "Usuario" ALTER COLUMN "estabelecimentoId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_estabelecimentoId_fkey" FOREIGN KEY ("estabelecimentoId") REFERENCES "Estabelecimento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
