-- AlterTable
ALTER TABLE "AnswerOption" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;
