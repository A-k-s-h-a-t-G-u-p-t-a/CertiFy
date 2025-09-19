/*
  Warnings:

  - Added the required column `url` to the `Certificate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Certificate" ADD COLUMN     "url" TEXT NOT NULL;
