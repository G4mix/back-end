/*
  Warnings:

  - You are about to drop the column `userProfileId` on the `Comment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[authorId,postId]` on the table `Comment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[authorId,id]` on the table `Comment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `authorId` to the `Comment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Comment_userProfileId_id_key";

-- DropIndex
DROP INDEX "Comment_userProfileId_idx";

-- DropIndex
DROP INDEX "Comment_userProfileId_postId_key";

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "userProfileId",
ADD COLUMN     "authorId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "Comment_authorId_postId_key" ON "Comment"("authorId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "Comment_authorId_id_key" ON "Comment"("authorId", "id");
