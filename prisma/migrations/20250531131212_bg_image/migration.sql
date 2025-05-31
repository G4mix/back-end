/*
  Warnings:

  - You are about to alter the column `autobiography` on the `UserProfile` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.

*/
-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "backgroundImage" VARCHAR(2048),
ALTER COLUMN "autobiography" SET DATA TYPE VARCHAR(500);
