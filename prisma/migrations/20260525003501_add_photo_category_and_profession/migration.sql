/*
  Warnings:

  - The `category` column on the `photos` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PhotoCategory" AS ENUM ('APP_SCREEN', 'ID_DOCUMENT', 'STOREFRONT', 'QR_CODE');

-- AlterTable
ALTER TABLE "photos" DROP COLUMN "category",
ADD COLUMN     "category" "PhotoCategory";

-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "prospectProfession" TEXT;
