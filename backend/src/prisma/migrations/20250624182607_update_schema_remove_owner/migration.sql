/*
  Warnings:

  - You are about to drop the column `ownerId` on the `Database` table. All the data in the column will be lost.
  - You are about to drop the `fragen` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hint` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `todos` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Database" DROP CONSTRAINT "Database_ownerId_fkey";

-- AlterTable
ALTER TABLE "Database" DROP COLUMN "ownerId";

-- DropTable
DROP TABLE "fragen";

-- DropTable
DROP TABLE "hint";

-- DropTable
DROP TABLE "todos";

-- CreateTable
CREATE TABLE "Submission" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "exerciseId" INTEGER NOT NULL,
    "answerText" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
