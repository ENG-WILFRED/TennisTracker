-- Add flexible pricing models for coaching sessions

-- SessionPayment table for tracking coaching session payments and pricing rules
CREATE TABLE "SessionPayment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL UNIQUE,
  "organizationId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "coachId" TEXT NOT NULL,
  "playerTier" TEXT,
  "amount" DECIMAL(10,2) NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "durationHours" DECIMAL(5,2) NOT NULL,
  "pricePerHour" DECIMAL(10,2) NOT NULL,
  "pricingRuleType" TEXT,
  "tierPriceId" TEXT,
  "coachPriceId" TEXT,
  "coachEarnings" DECIMAL(10,2) NOT NULL,
  "coachCommissionRate" DECIMAL(3,2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "chargedAt" TIMESTAMP(3),
  "paidToCoachAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SessionPayment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CoachSession" ("id") ON DELETE CASCADE,
  CONSTRAINT "SessionPayment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE
);

CREATE INDEX "SessionPayment_organizationId_idx" ON "SessionPayment"("organizationId");
CREATE INDEX "SessionPayment_playerId_idx" ON "SessionPayment"("playerId");
CREATE INDEX "SessionPayment_coachId_idx" ON "SessionPayment"("coachId");
CREATE INDEX "SessionPayment_status_idx" ON "SessionPayment"("status");
CREATE INDEX "SessionPayment_createdAt_idx" ON "SessionPayment"("createdAt");

-- OrgCoachingPricing base table for organization-level coaching pricing
CREATE TABLE "OrgCoachingPricing" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL UNIQUE,
  "pricePerHour" DECIMAL(8,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "minSessionDurationMinutes" INTEGER NOT NULL DEFAULT 30,
  "roundingType" TEXT NOT NULL DEFAULT 'up',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrgCoachingPricing_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE
);

CREATE INDEX "OrgCoachingPricing_organizationId_idx" ON "OrgCoachingPricing"("organizationId");

-- TierCoachingPrice table for tier-based pricing overrides
CREATE TABLE "TierCoachingPrice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "pricingId" TEXT NOT NULL,
  "tierName" TEXT NOT NULL,
  "pricePerHour" DECIMAL(8,2) NOT NULL,
  "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TierCoachingPrice_pricingId_fkey" FOREIGN KEY ("pricingId") REFERENCES "OrgCoachingPricing" ("id") ON DELETE CASCADE
);

-- CoachSpecificPrice table for coach-specific pricing
CREATE TABLE "CoachSpecificPrice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "pricingId" TEXT NOT NULL,
  "coachId" TEXT NOT NULL,
  "pricePerHour" DECIMAL(8,2) NOT NULL,
  "tierName" TEXT,
  "description" TEXT,
  "reason" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CoachSpecificPrice_pricingId_fkey" FOREIGN KEY ("pricingId") REFERENCES "OrgCoachingPricing" ("id") ON DELETE CASCADE,
  CONSTRAINT "CoachSpecificPrice_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Staff" ("userId") ON DELETE CASCADE
);

-- Add foreign key constraints for SessionPayment pricing rules
ALTER TABLE "SessionPayment" ADD CONSTRAINT "SessionPayment_tierPriceId_fkey" FOREIGN KEY ("tierPriceId") REFERENCES "TierCoachingPrice" ("id") ON DELETE SET NULL;
ALTER TABLE "SessionPayment" ADD CONSTRAINT "SessionPayment_coachPriceId_fkey" FOREIGN KEY ("coachPriceId") REFERENCES "CoachSpecificPrice" ("id") ON DELETE SET NULL;

-- Create indexes for performance
CREATE UNIQUE INDEX "TierCoachingPrice_pricingId_tierName_key" ON "TierCoachingPrice"("pricingId", "tierName");
CREATE INDEX "TierCoachingPrice_pricingId_idx" ON "TierCoachingPrice"("pricingId");
CREATE INDEX "TierCoachingPrice_isActive_idx" ON "TierCoachingPrice"("isActive");

CREATE UNIQUE INDEX "CoachSpecificPrice_pricingId_coachId_tierName_key" ON "CoachSpecificPrice"("pricingId", "coachId", "tierName");
CREATE INDEX "CoachSpecificPrice_pricingId_idx" ON "CoachSpecificPrice"("pricingId");
CREATE INDEX "CoachSpecificPrice_coachId_idx" ON "CoachSpecificPrice"("coachId");
CREATE INDEX "CoachSpecificPrice_isActive_idx" ON "CoachSpecificPrice"("isActive");

CREATE INDEX "SessionPayment_pricingRuleType_idx" ON "SessionPayment"("pricingRuleType");
CREATE INDEX "SessionPayment_tierPriceId_idx" ON "SessionPayment"("tierPriceId");
CREATE INDEX "SessionPayment_coachPriceId_idx" ON "SessionPayment"("coachPriceId");