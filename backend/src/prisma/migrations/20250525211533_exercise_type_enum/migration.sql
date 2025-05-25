/*
  Warnings:

  - The values [SINGLE_CHOICE,MULTIPLE_CHOICE,SQL_QUERY] on the enum `ExerciseType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ExerciseType_new" AS ENUM ('CHOICE', 'QUERY', 'FREETEXT');
ALTER TABLE "Exercise" ALTER COLUMN "type" TYPE "ExerciseType_new" USING ("type"::text::"ExerciseType_new");
ALTER TYPE "ExerciseType" RENAME TO "ExerciseType_old";
ALTER TYPE "ExerciseType_new" RENAME TO "ExerciseType";
DROP TYPE "ExerciseType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "querySolution" TEXT;
