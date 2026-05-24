-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COORDINATEUR', 'SUPERVISEUR', 'COMMERCIAL', 'CLIENT');

-- CreateEnum
CREATE TYPE "SubmissionType" AS ENUM ('PROSPECT', 'MARCHAND');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'SUPERVISOR_APPROVED', 'VALIDATED', 'REJECTED_L1', 'REJECTED_L2');

-- CreateEnum
CREATE TYPE "AppStatus" AS ENUM ('NOT_INSTALLED', 'INSTALLED', 'ACTIVATED');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('ACTIF', 'SUSPENDU', 'EN_ATTENTE', 'DESACTIVE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('HOMME', 'FEMME');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CNI', 'PHOTO_IDENTITE', 'CONTRAT', 'BADGE', 'RIB', 'MOBILE_MONEY', 'AUTRE');

-- CreateEnum
CREATE TYPE "ValidationAction" AS ENUM ('SUBMITTED', 'SUPERVISOR_APPROVED', 'VALIDATED', 'REJECTED_L1', 'REJECTED_L2', 'RETURNED');

-- CreateTable
CREATE TABLE "zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "coordinatorId" TEXT,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "phoneSecondary" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "AgentStatus" NOT NULL DEFAULT 'ACTIF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "avatarUrl" TEXT,
    "gender" "Gender",
    "birthDate" TIMESTAMP(3),
    "cniNumber" TEXT,
    "address" TEXT,
    "educationLevel" TEXT,
    "languages" TEXT[],
    "recruitedAt" TIMESTAMP(3),
    "zoneId" TEXT,
    "supervisorId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "label" TEXT,
    "cloudinaryPublicId" TEXT,
    "url" TEXT NOT NULL,
    "mimeType" TEXT,
    "bytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "type" "SubmissionType" NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "commercialId" TEXT NOT NULL,
    "zoneId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "gpsAccuracy" DOUBLE PRECISION,
    "gpsCapturedAt" TIMESTAMP(3),
    "commune" TEXT NOT NULL,
    "quartier" TEXT,
    "addressNote" TEXT,
    "prospectFullName" TEXT,
    "prospectPhone" TEXT,
    "prospectGender" TEXT,
    "prospectAge" INTEGER,
    "appStatus" "AppStatus",
    "phoneType" TEXT,
    "bankAccount" TEXT,
    "observations" TEXT,
    "merchantName" TEXT,
    "merchantOwner" TEXT,
    "merchantPhone" TEXT,
    "merchantActivity" TEXT,
    "merchantRccm" TEXT,
    "clientUuid" TEXT NOT NULL,
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'SYNCED',
    "createdOffline" BOOLEAN NOT NULL DEFAULT false,
    "level1ValidatorId" TEXT,
    "level1At" TIMESTAMP(3),
    "level1Comment" TEXT,
    "level2ValidatorId" TEXT,
    "level2At" TIMESTAMP(3),
    "level2Comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "cloudinaryPublicId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "bytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validation_history" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" "ValidationAction" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validation_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "zones_name_key" ON "zones"("name");

-- CreateIndex
CREATE UNIQUE INDEX "zones_coordinatorId_key" ON "zones"("coordinatorId");

-- CreateIndex
CREATE INDEX "zones_isActive_idx" ON "zones"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "users_matricule_key" ON "users"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_zoneId_idx" ON "users"("zoneId");

-- CreateIndex
CREATE INDEX "users_supervisorId_idx" ON "users"("supervisorId");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "user_documents_userId_idx" ON "user_documents"("userId");

-- CreateIndex
CREATE INDEX "user_documents_type_idx" ON "user_documents"("type");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_clientUuid_key" ON "submissions"("clientUuid");

-- CreateIndex
CREATE INDEX "submissions_commercialId_idx" ON "submissions"("commercialId");

-- CreateIndex
CREATE INDEX "submissions_zoneId_idx" ON "submissions"("zoneId");

-- CreateIndex
CREATE INDEX "submissions_status_idx" ON "submissions"("status");

-- CreateIndex
CREATE INDEX "submissions_type_idx" ON "submissions"("type");

-- CreateIndex
CREATE INDEX "submissions_commune_idx" ON "submissions"("commune");

-- CreateIndex
CREATE INDEX "submissions_createdAt_idx" ON "submissions"("createdAt");

-- CreateIndex
CREATE INDEX "submissions_prospectPhone_idx" ON "submissions"("prospectPhone");

-- CreateIndex
CREATE INDEX "submissions_status_type_idx" ON "submissions"("status", "type");

-- CreateIndex
CREATE INDEX "submissions_level1ValidatorId_idx" ON "submissions"("level1ValidatorId");

-- CreateIndex
CREATE INDEX "submissions_level2ValidatorId_idx" ON "submissions"("level2ValidatorId");

-- CreateIndex
CREATE INDEX "photos_submissionId_idx" ON "photos"("submissionId");

-- CreateIndex
CREATE INDEX "validation_history_submissionId_idx" ON "validation_history"("submissionId");

-- CreateIndex
CREATE INDEX "validation_history_actorId_idx" ON "validation_history"("actorId");

-- AddForeignKey
ALTER TABLE "zones" ADD CONSTRAINT "zones_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_documents" ADD CONSTRAINT "user_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_commercialId_fkey" FOREIGN KEY ("commercialId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_level1ValidatorId_fkey" FOREIGN KEY ("level1ValidatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_level2ValidatorId_fkey" FOREIGN KEY ("level2ValidatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_history" ADD CONSTRAINT "validation_history_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_history" ADD CONSTRAINT "validation_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
