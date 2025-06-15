/*
  Warnings:

  - Added the required column `ownerId` to the `Database` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Database" ADD COLUMN     "ownerId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Database" ADD CONSTRAINT "Database_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
