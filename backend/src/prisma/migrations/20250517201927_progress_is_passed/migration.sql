-- AlterTable
ALTER TABLE "Progress" ADD COLUMN     "isPassed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passedAt" TIMESTAMP(3);
