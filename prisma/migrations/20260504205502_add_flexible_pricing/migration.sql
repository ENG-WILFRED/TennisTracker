-- Add flexible pricing models for coaching sessions
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

-- Add new columns to SessionPayment for tracking pricing rules
ALTER TABLE "SessionPayment" ADD COLUMN "playerTier" TEXT;
ALTER TABLE "SessionPayment" ADD COLUMN "pricingRuleType" TEXT;
ALTER TABLE "SessionPayment" ADD COLUMN "tierPriceId" TEXT;
ALTER TABLE "SessionPayment" ADD COLUMN "coachPriceId" TEXT;

-- Add foreign key constraints for the new columns
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