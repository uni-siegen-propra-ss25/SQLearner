-- AlterTable
ALTER TABLE "Database" ADD COLUMN     "exampleQueries" TEXT;

-- CreateTable
CREATE TABLE "Settings" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Settings_name_key" ON "Settings"("name");
