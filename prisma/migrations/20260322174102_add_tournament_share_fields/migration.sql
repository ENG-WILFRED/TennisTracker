-- AlterTable
ALTER TABLE "public"."CommunityPost" ADD COLUMN     "shareCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "tournamentId" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'post';

-- CreateIndex
CREATE INDEX "CommunityPost_tournamentId_idx" ON "public"."CommunityPost"("tournamentId");
