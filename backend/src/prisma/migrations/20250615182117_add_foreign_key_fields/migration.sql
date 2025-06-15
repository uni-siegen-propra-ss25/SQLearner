-- AlterTable
ALTER TABLE "DatabaseColumn" ADD COLUMN     "isForeignKey" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "referencesColumn" TEXT,
ADD COLUMN     "referencesTable" TEXT;
