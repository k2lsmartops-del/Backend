-- Script pour supprimer tous les utilisateurs sauf ADMIN
-- Base de données locale PostgreSQL

-- 1. Casser l'auto-référence users.supervisorId
UPDATE "User" 
SET "supervisorId" = NULL 
WHERE matricule != 'ADM-001';

-- 2. Supprimer les données transactionnelles
DELETE FROM "Photo";
DELETE FROM "ValidationHistory";
DELETE FROM "Submission";
DELETE FROM "RefreshToken" 
WHERE "userId" IN (SELECT id FROM "User" WHERE matricule != 'ADM-001');

-- 3. Nettoyer les références dans les master data
UPDATE "Secteur" 
SET "supervisorId" = NULL 
WHERE "supervisorId" IN (SELECT id FROM "User" WHERE matricule != 'ADM-001');

UPDATE "Zone" 
SET "coordinatorId" = NULL 
WHERE "coordinatorId" IN (SELECT id FROM "User" WHERE matricule != 'ADM-001');

-- 4. Supprimer les users (sauf admin)
DELETE FROM "User" WHERE matricule != 'ADM-001';
