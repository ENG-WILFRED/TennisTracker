-- AlterTable
ALTER TABLE "public"."Organization" ADD COLUMN     "activityScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "playerDevScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rating" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "ratingCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tournamentEngScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verifiedBadge" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."Court" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "courtNumber" INTEGER NOT NULL,
    "surface" TEXT NOT NULL,
    "indoorOutdoor" TEXT NOT NULL DEFAULT 'outdoor',
    "lights" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'available',
    "maintenedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Court_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourtBooking" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "memberId" TEXT,
    "playerName" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "bookingType" TEXT NOT NULL DEFAULT 'regular',
    "guestCount" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "price" DOUBLE PRECISION,
    "isPeak" BOOLEAN NOT NULL DEFAULT false,
    "cancellationReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourtBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MembershipTier" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPrice" DOUBLE PRECISION NOT NULL,
    "benefitsJson" TEXT,
    "courtHoursPerMonth" INTEGER,
    "maxConcurrentBookings" INTEGER DEFAULT 3,
    "discountPercentage" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembershipTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClubMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "tierId" TEXT,
    "joinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "paymentStatus" TEXT NOT NULL DEFAULT 'active',
    "outstandingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attendanceCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttendance" TIMESTAMP(3),
    "role" TEXT NOT NULL DEFAULT 'member',
    "suspensionReason" TEXT,
    "suspendedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PlayerRanking" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "currentRank" INTEGER NOT NULL,
    "previousRank" INTEGER,
    "ratingPoints" INTEGER NOT NULL,
    "matchesWon" INTEGER NOT NULL DEFAULT 0,
    "matchesLost" INTEGER NOT NULL DEFAULT 0,
    "winRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerRanking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RankingChallenge" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "challengerId" TEXT NOT NULL,
    "opponentId" TEXT NOT NULL,
    "challengeDate" TIMESTAMP(3) NOT NULL,
    "matchDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "winnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RankingChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClubEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "eventType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "registrationCap" INTEGER NOT NULL DEFAULT 64,
    "registrationDeadline" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "prizePool" DOUBLE PRECISION,
    "entryFee" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "signupOrder" INTEGER NOT NULL,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventWaitlist" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventWaitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TournamentBracket" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "bracketType" TEXT NOT NULL DEFAULT 'single_elimination',
    "totalRounds" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentBracket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TournamentMatch" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "bracketId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "matchPosition" INTEGER NOT NULL,
    "playerAId" TEXT,
    "playerBId" TEXT,
    "scoreSetA" TEXT,
    "scoreSetB" TEXT,
    "scoreSetC" TEXT,
    "winnerId" TEXT,
    "scheduledTime" TIMESTAMP(3),
    "courtId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resultSubmittedAt" TIMESTAMP(3),
    "resultSubmittedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClubAnnouncement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "announcementType" TEXT NOT NULL DEFAULT 'general',
    "targetRoles" TEXT[] DEFAULT ARRAY['member']::TEXT[],
    "createdBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "readBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventReminder" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "reminderText" TEXT NOT NULL,
    "scheduleTime" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClubFinance" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "membershipRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "courtBookingRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "coachCommissions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "eventRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubFinance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FinanceTransaction" (
    "id" TEXT NOT NULL,
    "financeId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "transactionType" TEXT NOT NULL DEFAULT 'credit',
    "memberId" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrganizationRole" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RolePermission" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrganizationBadge" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "badgeName" TEXT NOT NULL,
    "badgeType" TEXT NOT NULL DEFAULT 'custom',
    "achievementDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClubRating" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "ratedBy" TEXT,
    "rating" DOUBLE PRECISION NOT NULL,
    "category" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Court_organizationId_courtNumber_key" ON "public"."Court"("organizationId", "courtNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipTier_name_key" ON "public"."MembershipTier"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ClubMember_organizationId_playerId_key" ON "public"."ClubMember"("organizationId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerRanking_organizationId_memberId_weekNumber_year_key" ON "public"."PlayerRanking"("organizationId", "memberId", "weekNumber", "year");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_eventId_memberId_key" ON "public"."EventRegistration"("eventId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "EventWaitlist_eventId_memberId_key" ON "public"."EventWaitlist"("eventId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentBracket_eventId_key" ON "public"."TournamentBracket"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "ClubFinance_organizationId_month_year_key" ON "public"."ClubFinance"("organizationId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationRole_organizationId_name_key" ON "public"."OrganizationRole"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionName_key" ON "public"."RolePermission"("roleId", "permissionName");

-- AddForeignKey
ALTER TABLE "public"."Court" ADD CONSTRAINT "Court_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourtBooking" ADD CONSTRAINT "CourtBooking_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourtBooking" ADD CONSTRAINT "CourtBooking_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "public"."Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourtBooking" ADD CONSTRAINT "CourtBooking_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."ClubMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MembershipTier" ADD CONSTRAINT "MembershipTier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClubMember" ADD CONSTRAINT "ClubMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClubMember" ADD CONSTRAINT "ClubMember_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClubMember" ADD CONSTRAINT "ClubMember_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "public"."MembershipTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlayerRanking" ADD CONSTRAINT "PlayerRanking_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlayerRanking" ADD CONSTRAINT "PlayerRanking_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."ClubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RankingChallenge" ADD CONSTRAINT "RankingChallenge_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RankingChallenge" ADD CONSTRAINT "RankingChallenge_challengerId_fkey" FOREIGN KEY ("challengerId") REFERENCES "public"."ClubMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RankingChallenge" ADD CONSTRAINT "RankingChallenge_opponentId_fkey" FOREIGN KEY ("opponentId") REFERENCES "public"."ClubMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClubEvent" ADD CONSTRAINT "ClubEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventRegistration" ADD CONSTRAINT "EventRegistration_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."ClubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventWaitlist" ADD CONSTRAINT "EventWaitlist_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventWaitlist" ADD CONSTRAINT "EventWaitlist_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."ClubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentBracket" ADD CONSTRAINT "TournamentBracket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentBracket" ADD CONSTRAINT "TournamentBracket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentMatch" ADD CONSTRAINT "TournamentMatch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentMatch" ADD CONSTRAINT "TournamentMatch_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentMatch" ADD CONSTRAINT "TournamentMatch_bracketId_fkey" FOREIGN KEY ("bracketId") REFERENCES "public"."TournamentBracket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentMatch" ADD CONSTRAINT "TournamentMatch_playerAId_fkey" FOREIGN KEY ("playerAId") REFERENCES "public"."ClubMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentMatch" ADD CONSTRAINT "TournamentMatch_playerBId_fkey" FOREIGN KEY ("playerBId") REFERENCES "public"."ClubMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentMatch" ADD CONSTRAINT "TournamentMatch_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "public"."Court"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClubAnnouncement" ADD CONSTRAINT "ClubAnnouncement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventReminder" ADD CONSTRAINT "EventReminder_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClubFinance" ADD CONSTRAINT "ClubFinance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FinanceTransaction" ADD CONSTRAINT "FinanceTransaction_financeId_fkey" FOREIGN KEY ("financeId") REFERENCES "public"."ClubFinance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FinanceTransaction" ADD CONSTRAINT "FinanceTransaction_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."ClubMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrganizationRole" ADD CONSTRAINT "OrganizationRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."OrganizationRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrganizationBadge" ADD CONSTRAINT "OrganizationBadge_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClubRating" ADD CONSTRAINT "ClubRating_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
