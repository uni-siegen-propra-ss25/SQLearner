/*
  Warnings:

  - The values [CHOICE] on the enum `ExerciseType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ExerciseType_new" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'QUERY', 'FREETEXT');
ALTER TABLE "Exercise" ALTER COLUMN "type" TYPE "ExerciseType_new" USING ("type"::text::"ExerciseType_new");
ALTER TYPE "ExerciseType" RENAME TO "ExerciseType_old";
ALTER TYPE "ExerciseType_new" RENAME TO "ExerciseType";
DROP TYPE "ExerciseType_old";
COMMIT;
