/*
  Warnings:

  - You are about to drop the column `submissionId` on the `DbSession` table. All the data in the column will be lost.
  - The `status` column on the `DbSession` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `DatabaseColumn` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DatabaseTable` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DatabaseTableData` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Submission` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,exerciseId]` on the table `DbSession` will be added. If there are existing duplicate values, this will fail.
  - Made the column `schemaSql` on table `Database` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `exerciseId` to the `DbSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `DbSession` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ContainerStatus" AS ENUM ('CREATING', 'RUNNING', 'FAILED', 'FINISHED', 'RESTARTING');

-- CreateEnum
CREATE TYPE "ContainerHealth" AS ENUM ('HEALTHY', 'UNHEALTHY', 'STARTING', 'UNKNOWN');

-- DropForeignKey
ALTER TABLE "DatabaseColumn" DROP CONSTRAINT "DatabaseColumn_tableId_fkey";

-- DropForeignKey
ALTER TABLE "DatabaseTable" DROP CONSTRAINT "DatabaseTable_databaseId_fkey";

-- DropForeignKey
ALTER TABLE "DatabaseTableData" DROP CONSTRAINT "DatabaseTableData_columnId_fkey";

-- DropForeignKey
ALTER TABLE "DatabaseTableData" DROP CONSTRAINT "DatabaseTableData_tableId_fkey";

-- DropForeignKey
ALTER TABLE "DbSession" DROP CONSTRAINT "DbSession_submissionId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_exerciseId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_userId_fkey";

-- DropIndex
DROP INDEX "DbSession_submissionId_key";

-- AlterTable
ALTER TABLE "Database" ALTER COLUMN "schemaSql" SET NOT NULL;

-- AlterTable
ALTER TABLE "DbSession" DROP COLUMN "submissionId",
ADD COLUMN     "autoRemove" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "dbPassword" TEXT,
ADD COLUMN     "dbUser" TEXT,
ADD COLUMN     "exerciseId" INTEGER NOT NULL,
ADD COLUMN     "host" TEXT,
ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "port" INTEGER,
ADD COLUMN     "restartCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "timeoutMins" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "userId" INTEGER NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ContainerStatus" NOT NULL DEFAULT 'CREATING';

-- DropTable
DROP TABLE "DatabaseColumn";

-- DropTable
DROP TABLE "DatabaseTable";

-- DropTable
DROP TABLE "DatabaseTableData";

-- DropTable
DROP TABLE "Submission";

-- CreateIndex
CREATE INDEX "DbSession_containerId_idx" ON "DbSession"("containerId");

-- CreateIndex
CREATE INDEX "DbSession_userId_idx" ON "DbSession"("userId");

-- CreateIndex
CREATE INDEX "DbSession_status_idx" ON "DbSession"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DbSession_userId_exerciseId_key" ON "DbSession"("userId", "exerciseId");

-- AddForeignKey
ALTER TABLE "DbSession" ADD CONSTRAINT "DbSession_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DbSession" ADD CONSTRAINT "DbSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
