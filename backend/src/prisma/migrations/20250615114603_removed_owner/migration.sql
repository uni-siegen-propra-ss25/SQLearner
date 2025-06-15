/*
  Warnings:

  - You are about to drop the column `ownerId` on the `Database` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Database" DROP CONSTRAINT "Database_ownerId_fkey";

-- AlterTable
ALTER TABLE "Database" DROP COLUMN "ownerId";
