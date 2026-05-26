-- Migration: Add geographic schema (Commune, Quartier, Secteur)
-- Remove RH fields from User, remove UserDocument model and related enums

-- ══════════════════════════════════════════════════════════════
-- Step 1: Create new tables (Commune, Quartier, Secteur)
-- ══════════════════════════════════════════════════════════════

-- Secteurs table
CREATE TABLE "secteurs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "zoneId" TEXT NOT NULL,
    "supervisorId" TEXT,

    CONSTRAINT "secteurs_pkey" PRIMARY KEY ("id")
);

-- Communes table
CREATE TABLE "communes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zoneId" TEXT,

    CONSTRAINT "communes_pkey" PRIMARY KEY ("id")
);

-- Quartiers table
CREATE TABLE "quartiers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "communeId" TEXT NOT NULL,
    "secteurId" TEXT,

    CONSTRAINT "quartiers_pkey" PRIMARY KEY ("id")
);

-- ══════════════════════════════════════════════════════════════
-- Step 2: Add new columns to User
-- ══════════════════════════════════════════════════════════════

ALTER TABLE "users" ADD COLUMN "secteurId" TEXT;

-- ══════════════════════════════════════════════════════════════
-- Step 3: Add new columns to Submission (denormalized geo)
-- ══════════════════════════════════════════════════════════════

ALTER TABLE "submissions" ADD COLUMN "secteurId" TEXT;
ALTER TABLE "submissions" ADD COLUMN "communeId" TEXT;
ALTER TABLE "submissions" ADD COLUMN "quartierId" TEXT;

-- ══════════════════════════════════════════════════════════════
-- Step 4: Add unique constraints
-- ══════════════════════════════════════════════════════════════

CREATE UNIQUE INDEX "secteurs_supervisorId_key" ON "secteurs"("supervisorId");
CREATE UNIQUE INDEX "secteurs_name_zoneId_key" ON "secteurs"("name", "zoneId");
CREATE UNIQUE INDEX "communes_name_key" ON "communes"("name");
CREATE UNIQUE INDEX "quartiers_name_communeId_key" ON "quartiers"("name", "communeId");

-- ══════════════════════════════════════════════════════════════
-- Step 5: Add indexes
-- ══════════════════════════════════════════════════════════════

-- Secteurs indexes
CREATE INDEX "secteurs_zoneId_idx" ON "secteurs"("zoneId");
CREATE INDEX "secteurs_isActive_idx" ON "secteurs"("isActive");

-- Communes indexes
CREATE INDEX "communes_zoneId_idx" ON "communes"("zoneId");

-- Quartiers indexes
CREATE INDEX "quartiers_communeId_idx" ON "quartiers"("communeId");
CREATE INDEX "quartiers_secteurId_idx" ON "quartiers"("secteurId");

-- User secteurId index
CREATE INDEX "users_secteurId_idx" ON "users"("secteurId");

-- Submission geo indexes
CREATE INDEX "submissions_secteurId_idx" ON "submissions"("secteurId");
CREATE INDEX "submissions_communeId_idx" ON "submissions"("communeId");
CREATE INDEX "submissions_quartierId_idx" ON "submissions"("quartierId");

-- ══════════════════════════════════════════════════════════════
-- Step 6: Add foreign keys
-- ══════════════════════════════════════════════════════════════

-- Secteur FK
ALTER TABLE "secteurs" ADD CONSTRAINT "secteurs_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "secteurs" ADD CONSTRAINT "secteurs_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Commune FK
ALTER TABLE "communes" ADD CONSTRAINT "communes_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Quartier FK
ALTER TABLE "quartiers" ADD CONSTRAINT "quartiers_communeId_fkey" FOREIGN KEY ("communeId") REFERENCES "communes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quartiers" ADD CONSTRAINT "quartiers_secteurId_fkey" FOREIGN KEY ("secteurId") REFERENCES "secteurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- User -> Secteur FK
ALTER TABLE "users" ADD CONSTRAINT "users_secteurId_fkey" FOREIGN KEY ("secteurId") REFERENCES "secteurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Submission -> geo FK
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_secteurId_fkey" FOREIGN KEY ("secteurId") REFERENCES "secteurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_communeId_fkey" FOREIGN KEY ("communeId") REFERENCES "communes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_quartierId_fkey" FOREIGN KEY ("quartierId") REFERENCES "quartiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ══════════════════════════════════════════════════════════════
-- Step 7: Remove RH fields from User (allègement)
-- ══════════════════════════════════════════════════════════════

ALTER TABLE "users" DROP COLUMN IF EXISTS "avatarUrl";
ALTER TABLE "users" DROP COLUMN IF EXISTS "gender";
ALTER TABLE "users" DROP COLUMN IF EXISTS "birthDate";
ALTER TABLE "users" DROP COLUMN IF EXISTS "cniNumber";
ALTER TABLE "users" DROP COLUMN IF EXISTS "address";
ALTER TABLE "users" DROP COLUMN IF EXISTS "educationLevel";
ALTER TABLE "users" DROP COLUMN IF EXISTS "languages";
ALTER TABLE "users" DROP COLUMN IF EXISTS "phoneSecondary";
ALTER TABLE "users" DROP COLUMN IF EXISTS "recruitedAt";

-- ══════════════════════════════════════════════════════════════
-- Step 8: Drop UserDocument table and related enums
-- ══════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS "user_documents";
DROP TYPE IF EXISTS "DocumentType";
DROP TYPE IF EXISTS "Gender";
