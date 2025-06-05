-- Remove exampleQueries column from Database table
ALTER TABLE "Database" DROP COLUMN IF EXISTS "exampleQueries";

-- Drop Settings table if it exists
DROP TABLE IF EXISTS "Settings"; 