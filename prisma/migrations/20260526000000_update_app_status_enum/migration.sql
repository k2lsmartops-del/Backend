-- Migration: Update AppStatus enum
-- Remove NOT_INSTALLED and ACTIVATED, keep INSTALLED, add INSTALLED_ACTIVATED

-- Step 1: Convert column to TEXT to allow free data manipulation
ALTER TABLE "submissions" ALTER COLUMN "appStatus" TYPE TEXT USING ("appStatus"::text);

-- Step 2: Convert old values to new values
UPDATE "submissions" SET "appStatus" = 'INSTALLED' WHERE "appStatus" = 'NOT_INSTALLED';
UPDATE "submissions" SET "appStatus" = 'INSTALLED_ACTIVATED' WHERE "appStatus" = 'ACTIVATED';

-- Step 3: Drop old enum
DROP TYPE "AppStatus";

-- Step 4: Create new enum with only 2 values
CREATE TYPE "AppStatus" AS ENUM ('INSTALLED', 'INSTALLED_ACTIVATED');

-- Step 5: Convert column back to the new enum
ALTER TABLE "submissions" ALTER COLUMN "appStatus" TYPE "AppStatus" USING ("appStatus"::"AppStatus");
