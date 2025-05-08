/*
  Warnings:

  - A unique constraint covering the columns `[postId]` on the table `Comment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[postId,parentCommentId]` on the table `Comment` will be added. If there are existing duplicate values, this will fail.
  - Made the column `postId` on table `Comment` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Comment_authorId_id_key";

-- DropIndex
DROP INDEX "Comment_authorId_postId_key";

-- AlterTable
ALTER TABLE "Comment" ALTER COLUMN "postId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Comment_postId_key" ON "Comment"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "Comment_postId_parentCommentId_key" ON "Comment"("postId", "parentCommentId");
