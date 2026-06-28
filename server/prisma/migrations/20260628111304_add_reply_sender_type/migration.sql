/*
  Warnings:

  - Added the required column `senderType` to the `Reply` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('Agent', 'Customer');

-- AlterTable
ALTER TABLE "Reply" ADD COLUMN     "senderType" "SenderType" NOT NULL;
