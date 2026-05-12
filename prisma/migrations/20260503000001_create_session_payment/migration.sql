-- CreateTable SessionPayment
CREATE TABLE "SessionPayment" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "durationHours" DECIMAL(5,2) NOT NULL,
    "pricePerHour" DECIMAL(10,2) NOT NULL,
    "coachEarnings" DECIMAL(10,2) NOT NULL,
    "coachCommissionRate" DECIMAL(3,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "chargedAt" TIMESTAMP(3),
    "paidToCoachAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionPayment_sessionId_key" ON "SessionPayment"("sessionId");

-- CreateIndex
CREATE INDEX "SessionPayment_organizationId_idx" ON "SessionPayment"("organizationId");

-- CreateIndex
CREATE INDEX "SessionPayment_playerId_idx" ON "SessionPayment"("playerId");

-- CreateIndex
CREATE INDEX "SessionPayment_coachId_idx" ON "SessionPayment"("coachId");

-- CreateIndex
CREATE INDEX "SessionPayment_status_idx" ON "SessionPayment"("status");

-- CreateIndex
CREATE INDEX "SessionPayment_createdAt_idx" ON "SessionPayment"("createdAt");

-- AddForeignKey
ALTER TABLE "SessionPayment" ADD CONSTRAINT "SessionPayment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CoachSession"("id") ON DELETE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPayment" ADD CONSTRAINT "SessionPayment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;
