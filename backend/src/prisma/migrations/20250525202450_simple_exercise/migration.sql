/*
  Warnings:

  - You are about to drop the column `generationPrompt` on the `Exercise` table. All the data in the column will be lost.
  - You are about to drop the column `isGenerated` on the `Exercise` table. All the data in the column will be lost.
  - You are about to drop the column `llmPrompt` on the `Exercise` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Exercise" DROP COLUMN "generationPrompt",
DROP COLUMN "isGenerated",
DROP COLUMN "llmPrompt";
