/*
  Warnings:

  - You are about to drop the column `topicId` on the `DiscussionComment` table. All the data in the column will be lost.
  - You are about to drop the `DiscussionTopic` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `threadId` to the `DiscussionComment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DiscussionComment" DROP CONSTRAINT "DiscussionComment_topicId_fkey";

-- DropForeignKey
ALTER TABLE "DiscussionTopic" DROP CONSTRAINT "DiscussionTopic_authorId_fkey";

-- AlterTable
ALTER TABLE "DiscussionComment" DROP COLUMN "topicId",
ADD COLUMN     "threadId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "DiscussionTopic";

-- CreateTable
CREATE TABLE "DiscussionThread" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionThread_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiscussionThread_isPinned_createdAt_idx" ON "DiscussionThread"("isPinned", "createdAt");

-- CreateIndex
CREATE INDEX "DiscussionComment_threadId_createdAt_idx" ON "DiscussionComment"("threadId", "createdAt");

-- AddForeignKey
ALTER TABLE "DiscussionThread" ADD CONSTRAINT "DiscussionThread_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionComment" ADD CONSTRAINT "DiscussionComment_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "DiscussionThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
