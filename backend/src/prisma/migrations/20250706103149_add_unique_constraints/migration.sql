/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `Chapter` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Database` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[chapterId,title]` on the table `Topic` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Chapter_title_key" ON "Chapter"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Database_name_key" ON "Database"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_chapterId_title_key" ON "Topic"("chapterId", "title");
