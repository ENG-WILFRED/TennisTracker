-- CreateTable
CREATE TABLE "public"."CoachSession" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "organizationId" TEXT,
    "playerId" TEXT,
    "sessionType" TEXT NOT NULL DEFAULT '1-on-1',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "courtId" TEXT,
    "maxParticipants" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "cancellationReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SessionBooking" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attendanceStatus" TEXT DEFAULT 'pending',
    "notes" TEXT,
    "feedbackRating" DOUBLE PRECISION DEFAULT 0,
    "feedbackText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SessionBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CoachWallet" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "totalEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalWithdrawn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "balanceBefore" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CoachPayout" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT NOT NULL,
    "bankDetails" TEXT,
    "transactionRef" TEXT,
    "notes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CoachPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CoachPlayerRelationship" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSessionAt" TIMESTAMP(3),
    "sessionsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachPlayerRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CoachPlayerNote" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachPlayerNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CoachStats" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "completedSessions" INTEGER NOT NULL DEFAULT 0,
    "totalPlayers" INTEGER NOT NULL DEFAULT 0,
    "activePlayers" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "responseRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cancellationRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CoachDailyStats" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sessionsCount" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "newPlayers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachDailyStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CoachSessionReview" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachSessionReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachSession_coachId_startTime_idx" ON "public"."CoachSession"("coachId", "startTime");

-- CreateIndex
CREATE INDEX "CoachSession_organizationId_startTime_idx" ON "public"."CoachSession"("organizationId", "startTime");

-- CreateIndex
CREATE INDEX "CoachSession_playerId_startTime_idx" ON "public"."CoachSession"("playerId", "startTime");

-- CreateIndex
CREATE INDEX "CoachSession_status_idx" ON "public"."CoachSession"("status");

-- CreateIndex
CREATE INDEX "CoachSession_createdAt_idx" ON "public"."CoachSession"("createdAt");

-- CreateIndex
CREATE INDEX "SessionBooking_sessionId_idx" ON "public"."SessionBooking"("sessionId");

-- CreateIndex
CREATE INDEX "SessionBooking_playerId_idx" ON "public"."SessionBooking"("playerId");

-- CreateIndex
CREATE INDEX "SessionBooking_status_idx" ON "public"."SessionBooking"("status");

-- CreateIndex
CREATE INDEX "SessionBooking_createdAt_idx" ON "public"."SessionBooking"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SessionBooking_sessionId_playerId_key" ON "public"."SessionBooking"("sessionId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachWallet_coachId_key" ON "public"."CoachWallet"("coachId");

-- CreateIndex
CREATE INDEX "CoachWallet_coachId_idx" ON "public"."CoachWallet"("coachId");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_createdAt_idx" ON "public"."WalletTransaction"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "WalletTransaction_type_idx" ON "public"."WalletTransaction"("type");

-- CreateIndex
CREATE INDEX "CoachPayout_coachId_idx" ON "public"."CoachPayout"("coachId");

-- CreateIndex
CREATE INDEX "CoachPayout_status_idx" ON "public"."CoachPayout"("status");

-- CreateIndex
CREATE INDEX "CoachPayout_requestedAt_idx" ON "public"."CoachPayout"("requestedAt");

-- CreateIndex
CREATE INDEX "CoachPlayerRelationship_coachId_idx" ON "public"."CoachPlayerRelationship"("coachId");

-- CreateIndex
CREATE INDEX "CoachPlayerRelationship_playerId_idx" ON "public"."CoachPlayerRelationship"("playerId");

-- CreateIndex
CREATE INDEX "CoachPlayerRelationship_status_idx" ON "public"."CoachPlayerRelationship"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CoachPlayerRelationship_coachId_playerId_key" ON "public"."CoachPlayerRelationship"("coachId", "playerId");

-- CreateIndex
CREATE INDEX "CoachPlayerNote_relationshipId_idx" ON "public"."CoachPlayerNote"("relationshipId");

-- CreateIndex
CREATE INDEX "CoachPlayerNote_createdAt_idx" ON "public"."CoachPlayerNote"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CoachStats_coachId_key" ON "public"."CoachStats"("coachId");

-- CreateIndex
CREATE INDEX "CoachStats_coachId_idx" ON "public"."CoachStats"("coachId");

-- CreateIndex
CREATE INDEX "CoachDailyStats_coachId_date_idx" ON "public"."CoachDailyStats"("coachId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "CoachDailyStats_coachId_date_key" ON "public"."CoachDailyStats"("coachId", "date");

-- CreateIndex
CREATE INDEX "CoachSessionReview_coachId_idx" ON "public"."CoachSessionReview"("coachId");

-- CreateIndex
CREATE INDEX "CoachSessionReview_playerId_idx" ON "public"."CoachSessionReview"("playerId");

-- CreateIndex
CREATE INDEX "CoachSessionReview_createdAt_idx" ON "public"."CoachSessionReview"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CoachSessionReview_sessionId_playerId_key" ON "public"."CoachSessionReview"("sessionId", "playerId");

-- AddForeignKey
ALTER TABLE "public"."CoachSession" ADD CONSTRAINT "CoachSession_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "public"."Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoachSession" ADD CONSTRAINT "CoachSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoachSession" ADD CONSTRAINT "CoachSession_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoachSession" ADD CONSTRAINT "CoachSession_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "public"."Court"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SessionBooking" ADD CONSTRAINT "SessionBooking_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."CoachSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SessionBooking" ADD CONSTRAINT "SessionBooking_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoachWallet" ADD CONSTRAINT "CoachWallet_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "public"."Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "public"."CoachWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoachPayout" ADD CONSTRAINT "CoachPayout_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "public"."Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoachPlayerRelationship" ADD CONSTRAINT "CoachPlayerRelationship_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "public"."Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoachPlayerRelationship" ADD CONSTRAINT "CoachPlayerRelationship_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoachPlayerNote" ADD CONSTRAINT "CoachPlayerNote_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "public"."CoachPlayerRelationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoachStats" ADD CONSTRAINT "CoachStats_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "public"."Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoachDailyStats" ADD CONSTRAINT "CoachDailyStats_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "public"."Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoachSessionReview" ADD CONSTRAINT "CoachSessionReview_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "public"."Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoachSessionReview" ADD CONSTRAINT "CoachSessionReview_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
