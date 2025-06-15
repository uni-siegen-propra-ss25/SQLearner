/*
  Warnings:

  - You are about to drop the column `ownerId` on the `Database` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Database" DROP CONSTRAINT "Database_ownerId_fkey";

-- AlterTable
ALTER TABLE "Database" DROP COLUMN "ownerId";

-- CreateTable
CREATE TABLE "DatabaseTable" (
    "id" SERIAL NOT NULL,
    "databaseId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createSql" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatabaseTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatabaseColumn" (
    "id" SERIAL NOT NULL,
    "tableId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "nullable" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" TEXT,
    "primaryKey" BOOLEAN NOT NULL DEFAULT false,
    "autoIncrement" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatabaseColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatabaseTableData" (
    "id" SERIAL NOT NULL,
    "tableId" INTEGER NOT NULL,
    "columnId" INTEGER NOT NULL,
    "value" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatabaseTableData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DatabaseTable_databaseId_order_idx" ON "DatabaseTable"("databaseId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "DatabaseTable_databaseId_name_key" ON "DatabaseTable"("databaseId", "name");

-- CreateIndex
CREATE INDEX "DatabaseColumn_tableId_order_idx" ON "DatabaseColumn"("tableId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "DatabaseColumn_tableId_name_key" ON "DatabaseColumn"("tableId", "name");

-- CreateIndex
CREATE INDEX "DatabaseTableData_tableId_columnId_order_idx" ON "DatabaseTableData"("tableId", "columnId", "order");

-- AddForeignKey
ALTER TABLE "DatabaseTable" ADD CONSTRAINT "DatabaseTable_databaseId_fkey" FOREIGN KEY ("databaseId") REFERENCES "Database"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatabaseColumn" ADD CONSTRAINT "DatabaseColumn_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "DatabaseTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatabaseTableData" ADD CONSTRAINT "DatabaseTableData_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "DatabaseTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatabaseTableData" ADD CONSTRAINT "DatabaseTableData_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "DatabaseColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
