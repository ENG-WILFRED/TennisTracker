-- CreateTable
CREATE TABLE "public"."RuleAppeal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ruleCategory" TEXT,
    "ruleLabel" TEXT,
    "appealText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "responseText" TEXT,
    "respondedBy" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuleAppeal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RuleAppeal_eventId_idx" ON "public"."RuleAppeal"("eventId");

-- CreateIndex
CREATE INDEX "RuleAppeal_organizationId_idx" ON "public"."RuleAppeal"("organizationId");

-- CreateIndex
CREATE INDEX "RuleAppeal_userId_idx" ON "public"."RuleAppeal"("userId");

-- CreateIndex
CREATE INDEX "RuleAppeal_status_idx" ON "public"."RuleAppeal"("status");

-- AddForeignKey
ALTER TABLE "public"."RuleAppeal" ADD CONSTRAINT "RuleAppeal_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RuleAppeal" ADD CONSTRAINT "RuleAppeal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RuleAppeal" ADD CONSTRAINT "RuleAppeal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
