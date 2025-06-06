/*
  Warnings:

  - You are about to drop the column `topicBlockId` on the `Chapter` table. All the data in the column will be lost.
  - You are about to drop the column `chapterId` on the `Exercise` table. All the data in the column will be lost.
  - You are about to drop the `TopicBlock` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `topicId` to the `Exercise` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Chapter" DROP CONSTRAINT "Chapter_topicBlockId_fkey";

-- DropForeignKey
ALTER TABLE "Exercise" DROP CONSTRAINT "Exercise_chapterId_fkey";

-- AlterTable
ALTER TABLE "Chapter" DROP COLUMN "topicBlockId";

-- AlterTable
ALTER TABLE "Exercise" DROP COLUMN "chapterId",
ADD COLUMN     "topicId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "TopicBlock";

-- CreateTable
CREATE TABLE "Topic" (
    "id" SERIAL NOT NULL,
    "chapterId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
