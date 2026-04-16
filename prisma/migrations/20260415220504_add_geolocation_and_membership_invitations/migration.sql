-- AlterTable
ALTER TABLE "public"."CommunityPost" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'Kenya',
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "public"."MembershipInvitation" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "invitedBy" TEXT,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "acceptedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MembershipInvitation_orgId_idx" ON "public"."MembershipInvitation"("orgId");

-- CreateIndex
CREATE INDEX "MembershipInvitation_email_idx" ON "public"."MembershipInvitation"("email");

-- CreateIndex
CREATE INDEX "MembershipInvitation_status_idx" ON "public"."MembershipInvitation"("status");

-- CreateIndex
CREATE INDEX "MembershipInvitation_expiresAt_idx" ON "public"."MembershipInvitation"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipInvitation_orgId_email_role_key" ON "public"."MembershipInvitation"("orgId", "email", "role");

-- CreateIndex
CREATE INDEX "ClubRating_organizationId_idx" ON "public"."ClubRating"("organizationId");

-- CreateIndex
CREATE INDEX "ClubRating_ratedBy_idx" ON "public"."ClubRating"("ratedBy");

-- CreateIndex
CREATE INDEX "ClubRating_createdAt_idx" ON "public"."ClubRating"("createdAt");

-- CreateIndex
CREATE INDEX "CommunityPost_organizationId_idx" ON "public"."CommunityPost"("organizationId");

-- CreateIndex
CREATE INDEX "Match_refereeId_idx" ON "public"."Match"("refereeId");

-- CreateIndex
CREATE INDEX "Match_winnerId_idx" ON "public"."Match"("winnerId");

-- CreateIndex
CREATE INDEX "Match_createdAt_idx" ON "public"."Match"("createdAt");

-- CreateIndex
CREATE INDEX "OrganizationBadge_organizationId_idx" ON "public"."OrganizationBadge"("organizationId");

-- CreateIndex
CREATE INDEX "PaymentRecord_userId_idx" ON "public"."PaymentRecord"("userId");

-- CreateIndex
CREATE INDEX "PaymentRecord_eventId_idx" ON "public"."PaymentRecord"("eventId");

-- CreateIndex
CREATE INDEX "PaymentRecord_providerStatus_idx" ON "public"."PaymentRecord"("providerStatus");

-- CreateIndex
CREATE INDEX "PaymentRecord_createdAt_idx" ON "public"."PaymentRecord"("createdAt");

-- CreateIndex
CREATE INDEX "PostComment_createdAt_idx" ON "public"."PostComment"("createdAt");

-- CreateIndex
CREATE INDEX "TournamentMatch_round_idx" ON "public"."TournamentMatch"("round");

-- CreateIndex
CREATE INDEX "TournamentMatch_playerAId_idx" ON "public"."TournamentMatch"("playerAId");

-- CreateIndex
CREATE INDEX "TournamentMatch_playerBId_idx" ON "public"."TournamentMatch"("playerBId");

-- CreateIndex
CREATE INDEX "TournamentMatch_winnerId_idx" ON "public"."TournamentMatch"("winnerId");

-- CreateIndex
CREATE INDEX "TournamentMatch_scheduledTime_idx" ON "public"."TournamentMatch"("scheduledTime");

-- CreateIndex
CREATE INDEX "User_latitude_longitude_idx" ON "public"."User"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "User_city_idx" ON "public"."User"("city");

-- AddForeignKey
ALTER TABLE "public"."MembershipInvitation" ADD CONSTRAINT "MembershipInvitation_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommunityPost" ADD CONSTRAINT "CommunityPost_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
