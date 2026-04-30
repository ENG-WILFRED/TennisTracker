-- EventLog table for audit trail and event replay
CREATE TABLE "EventLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "type" TEXT NOT NULL,
  "aggregateId" TEXT NOT NULL,
  "aggregateType" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "publishedAt" TIMESTAMP(3) NOT NULL,
  "processedAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'published',
  "payload" JSONB NOT NULL,
  "metadata" JSONB,
  "processingRecords" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE
);

CREATE INDEX "EventLog_type_idx" ON "EventLog"("type");
CREATE INDEX "EventLog_aggregateId_idx" ON "EventLog"("aggregateId");
CREATE INDEX "EventLog_organizationId_idx" ON "EventLog"("organizationId");
CREATE INDEX "EventLog_publishedAt_idx" ON "EventLog"("publishedAt");
CREATE INDEX "EventLog_status_idx" ON "EventLog"("status");

-- InvoiceModel table
CREATE TABLE "InvoiceModel" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "parentId" TEXT,
  "invoiceNumber" TEXT NOT NULL,
  "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "lineItems" JSONB NOT NULL,
  "totalAmount" DECIMAL(12,2) NOT NULL,
  "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "paymentMethod" TEXT,
  "paidAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvoiceModel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE,
  CONSTRAINT "InvoiceModel_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("userId") ON DELETE CASCADE,
  CONSTRAINT "InvoiceModel_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User" ("id") ON DELETE SET NULL,
  UNIQUE("invoiceNumber", "organizationId")
);

CREATE INDEX "InvoiceModel_organizationId_idx" ON "InvoiceModel"("organizationId");
CREATE INDEX "InvoiceModel_playerId_idx" ON "InvoiceModel"("playerId");
CREATE INDEX "InvoiceModel_status_idx" ON "InvoiceModel"("status");
CREATE INDEX "InvoiceModel_dueDate_idx" ON "InvoiceModel"("dueDate");
CREATE UNIQUE INDEX "InvoiceModel_invoiceNumber_key" ON "InvoiceModel"("invoiceNumber");

-- LedgerEntry table
CREATE TABLE "LedgerEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT,
  "debitAccount" TEXT,
  "creditAccount" TEXT,
  "description" TEXT NOT NULL,
  "referenceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LedgerEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE
);

CREATE INDEX "LedgerEntry_organizationId_idx" ON "LedgerEntry"("organizationId");
CREATE INDEX "LedgerEntry_sourceType_idx" ON "LedgerEntry"("sourceType");
CREATE INDEX "LedgerEntry_createdAt_idx" ON "LedgerEntry"("createdAt");
CREATE INDEX "LedgerEntry_referenceId_idx" ON "LedgerEntry"("referenceId");

-- PaymentTransaction table
CREATE TABLE "PaymentTransaction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "gateway" TEXT NOT NULL,
  "transactionId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "error" TEXT,
  "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "PaymentTransaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE,
  UNIQUE("idempotencyKey")
);

CREATE INDEX "PaymentTransaction_organizationId_idx" ON "PaymentTransaction"("organizationId");
CREATE INDEX "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");
CREATE INDEX "PaymentTransaction_gateway_idx" ON "PaymentTransaction"("gateway");
CREATE UNIQUE INDEX "PaymentTransaction_idempotencyKey_key2" ON "PaymentTransaction"("idempotencyKey");

-- MetricWeight table
CREATE TABLE "MetricWeight" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "metricName" TEXT NOT NULL,
  "weight" DECIMAL(5,2) NOT NULL DEFAULT 1.0,
  "category" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MetricWeight_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE
);

CREATE INDEX "MetricWeight_organizationId_idx" ON "MetricWeight"("organizationId");

-- RecurringSession table
CREATE TABLE "RecurringSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "coachId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "pattern" TEXT NOT NULL,
  "daysOfWeek" INTEGER[],
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3) NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "maxParticipants" INTEGER NOT NULL DEFAULT 1,
  "price" FLOAT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecurringSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE,
  CONSTRAINT "RecurringSession_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Staff" ("userId") ON DELETE CASCADE
);

CREATE INDEX "RecurringSession_organizationId_idx" ON "RecurringSession"("organizationId");
CREATE INDEX "RecurringSession_coachId_idx" ON "RecurringSession"("coachId");
CREATE INDEX "RecurringSession_startDate_endDate_idx" ON "RecurringSession"("startDate", "endDate");

-- OwnershipTransfer table
CREATE TABLE "OwnershipTransfer" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "parentId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'dependent',
  "transferDate" TIMESTAMP(3),
  "reason" TEXT,
  "initiatedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OwnershipTransfer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE,
  CONSTRAINT "OwnershipTransfer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("userId") ON DELETE CASCADE,
  CONSTRAINT "OwnershipTransfer_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE INDEX "OwnershipTransfer_organizationId_idx" ON "OwnershipTransfer"("organizationId");
CREATE INDEX "OwnershipTransfer_playerId_idx" ON "OwnershipTransfer"("playerId");
CREATE INDEX "OwnershipTransfer_status_idx" ON "OwnershipTransfer"("status");

-- NotificationLogModel table
CREATE TABLE "NotificationLogModel" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'sent',
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationLogModel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE
);

CREATE INDEX "NotificationLogModel_organizationId_idx" ON "NotificationLogModel"("organizationId");
CREATE INDEX "NotificationLogModel_userId_idx" ON "NotificationLogModel"("userId");
CREATE INDEX "NotificationLogModel_status_idx" ON "NotificationLogModel"("status");

-- DailyPlayerStats table
CREATE TABLE "DailyPlayerStats" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "sessionsCompleted" INTEGER NOT NULL DEFAULT 0,
  "totalMinutes" INTEGER NOT NULL DEFAULT 0,
  "avgRating" FLOAT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DailyPlayerStats_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE,
  CONSTRAINT "DailyPlayerStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("userId") ON DELETE CASCADE
);

CREATE INDEX "DailyPlayerStats_organizationId_idx" ON "DailyPlayerStats"("organizationId");
CREATE INDEX "DailyPlayerStats_playerId_idx" ON "DailyPlayerStats"("playerId");
CREATE INDEX "DailyPlayerStats_date_idx" ON "DailyPlayerStats"("date");

-- CoachPerformanceSummary table
CREATE TABLE "CoachPerformanceSummary" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "coachId" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "sessionsCompleted" INTEGER NOT NULL DEFAULT 0,
  "playersManaged" INTEGER NOT NULL DEFAULT 0,
  "avgSessionRating" FLOAT,
  "totalEarned" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "pendingPayout" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CoachPerformanceSummary_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE,
  CONSTRAINT "CoachPerformanceSummary_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Staff" ("userId") ON DELETE CASCADE,
  UNIQUE("organizationId", "coachId", "period")
);

CREATE INDEX "CoachPerformanceSummary_organizationId_idx" ON "CoachPerformanceSummary"("organizationId");
CREATE INDEX "CoachPerformanceSummary_period_idx" ON "CoachPerformanceSummary"("period");

-- OrgMetricsSnapshot table
CREATE TABLE "OrgMetricsSnapshot" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL UNIQUE,
  "totalRevenue" DECIMAL(12,2) NOT NULL,
  "monthlyRecurring" DECIMAL(12,2) NOT NULL,
  "activePlayersCount" INTEGER NOT NULL,
  "newThisMonth" INTEGER NOT NULL,
  "churnedThisMonth" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrgMetricsSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE
);

-- RecommendationConfig table
CREATE TABLE "RecommendationConfig" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "minPlayerRating" FLOAT,
  "maxPlayerRating" FLOAT,
  "minSkillLevel" TEXT,
  "maxSkillLevel" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecommendationConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE
);

CREATE INDEX "RecommendationConfig_organizationId_idx" ON "RecommendationConfig"("organizationId");

-- Add recurringSessionId to CoachSession and relation to RecurringSession
ALTER TABLE "CoachSession" ADD COLUMN "recurringSessionId" TEXT;
ALTER TABLE "CoachSession" ADD CONSTRAINT "CoachSession_recurringSessionId_fkey" FOREIGN KEY ("recurringSessionId") REFERENCES "RecurringSession" ("id") ON DELETE SET NULL;
CREATE INDEX "CoachSession_recurringSessionId_idx" ON "CoachSession"("recurringSessionId");
