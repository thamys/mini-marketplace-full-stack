/*
Warnings:

- Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'ADMIN');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "passwordHash" TEXT NOT NULL DEFAULT '',
ADD COLUMN "role" "Role" NOT NULL DEFAULT 'CUSTOMER';

-- Remove default from passwordHash after backfilling existing rows
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP DEFAULT;