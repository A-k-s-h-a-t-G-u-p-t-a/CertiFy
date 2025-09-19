/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Organisation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Organisation_name_key" ON "public"."Organisation"("name");
