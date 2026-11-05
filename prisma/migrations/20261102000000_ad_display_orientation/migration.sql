-- CreateEnum
CREATE TYPE "AdOrientation" AS ENUM ('PORTRAIT', 'LANDSCAPE');

-- AlterTable
ALTER TABLE "AdDisplay" ADD COLUMN     "orientation" "AdOrientation" NOT NULL DEFAULT 'PORTRAIT';

