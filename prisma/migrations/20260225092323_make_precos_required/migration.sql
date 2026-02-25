/*
  Warnings:

  - Made the column `precoCompra` on table `Produto` required. This step will fail if there are existing NULL values in that column.
  - Made the column `precoVenda` on table `Produto` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Produto" ALTER COLUMN "precoCompra" SET NOT NULL,
ALTER COLUMN "precoCompra" SET DEFAULT 0,
ALTER COLUMN "precoVenda" SET NOT NULL,
ALTER COLUMN "precoVenda" SET DEFAULT 0;
