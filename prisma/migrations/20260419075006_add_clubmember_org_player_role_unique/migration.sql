/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,playerId,role]` on the table `ClubMember` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."ClubMember_organizationId_playerId_key";

-- AlterTable
ALTER TABLE "public"."CommunityPost" ALTER COLUMN "visibility" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ClubMember_organizationId_playerId_role_key" ON "public"."ClubMember"("organizationId", "playerId", "role");
