-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "userProfileId" TEXT,
ALTER COLUMN "postId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "autobiography" TEXT;

-- CreateIndex
CREATE INDEX "Link_userProfileId_idx" ON "Link"("userProfileId");
