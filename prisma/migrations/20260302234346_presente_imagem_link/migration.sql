/*
  Warnings:

  - You are about to drop the column `descricao` on the `presente` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `presente` DROP COLUMN `descricao`,
    ADD COLUMN `imagemUrl` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `linkProduto` VARCHAR(191) NULL;
