-- Multi-Dimensional Ranking System
-- This migration adds the new ranking architecture with event traceability

-- Competitive Rank Snapshot (Actual competitive strength)
CREATE TABLE "CompetitiveRankSnapshot" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "currentScore" INTEGER NOT NULL DEFAULT 1500,
  "previousScore" INTEGER,
  "rank" INTEGER,
  "previousRank" INTEGER,
  "matchesWon" INTEGER NOT NULL DEFAULT 0,
  "matchesLost" INTEGER NOT NULL DEFAULT 0,
  "winRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "tournament Wins" INTEGER NOT NULL DEFAULT 0,
  "opponentStrengthAvg" DECIMAL(5,2) DEFAULT 0,
  "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("playerId") REFERENCES "Player" ("userId") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "CompetitiveRankSnapshot_organizationId_playerId_key" ON "CompetitiveRankSnapshot"("organizationId", "playerId");
CREATE INDEX "CompetitiveRankSnapshot_organizationId_idx" ON "CompetitiveRankSnapshot"("organizationId");
CREATE INDEX "CompetitiveRankSnapshot_playerId_idx" ON "CompetitiveRankSnapshot"("playerId");
CREATE INDEX "CompetitiveRankSnapshot_currentScore_idx" ON "CompetitiveRankSnapshot"("currentScore" DESC);

-- Development Score Snapshot (Player growth & training consistency)
CREATE TABLE "DevelopmentScoreSnapshot" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "currentScore" INTEGER NOT NULL DEFAULT 0,
  "previousScore" INTEGER,
  "coachingSessionsAttended" INTEGER NOT NULL DEFAULT 0,
  "consistencyStreak" INTEGER DEFAULT 0,
  "improvementTrend" DECIMAL(5,2) DEFAULT 0,
  "coachAssessmentScore" DECIMAL(5,2) DEFAULT 0,
  "practiceParticipation" INTEGER DEFAULT 0,
  "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("playerId") REFERENCES "Player" ("userId") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "DevelopmentScoreSnapshot_organizationId_playerId_key" ON "DevelopmentScoreSnapshot"("organizationId", "playerId");
CREATE INDEX "DevelopmentScoreSnapshot_organizationId_idx" ON "DevelopmentScoreSnapshot"("organizationId");
CREATE INDEX "DevelopmentScoreSnapshot_playerId_idx" ON "DevelopmentScoreSnapshot"("playerId");
CREATE INDEX "DevelopmentScoreSnapshot_currentScore_idx" ON "DevelopmentScoreSnapshot"("currentScore" DESC);

-- Activity Score Snapshot (Court participation & engagement)
CREATE TABLE "ActivityScoreSnapshot" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "currentScore" INTEGER NOT NULL DEFAULT 0,
  "previousScore" INTEGER,
  "bookingsThisMonth" INTEGER NOT NULL DEFAULT 0,
  "courtAppearances" INTEGER NOT NULL DEFAULT 0,
  "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
  "recentParticipationFrequency" DECIMAL(5,2) DEFAULT 0,
  "consecutiveDaysActive" INTEGER DEFAULT 0,
  "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("playerId") REFERENCES "Player" ("userId") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "ActivityScoreSnapshot_organizationId_playerId_key" ON "ActivityScoreSnapshot"("organizationId", "playerId");
CREATE INDEX "ActivityScoreSnapshot_organizationId_idx" ON "ActivityScoreSnapshot"("organizationId");
CREATE INDEX "ActivityScoreSnapshot_playerId_idx" ON "ActivityScoreSnapshot"("playerId");
CREATE INDEX "ActivityScoreSnapshot_currentScore_idx" ON "ActivityScoreSnapshot"("currentScore" DESC);

-- Coach Reputation Score (Coach evaluation metrics)
CREATE TABLE "CoachReputationScoreSnapshot" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "coachId" TEXT NOT NULL,
  "currentScore" INTEGER NOT NULL DEFAULT 0,
  "previousScore" INTEGER,
  "punctualityRating" DECIMAL(3,2) DEFAULT 0,
  "disciplineRating" DECIMAL(3,2) DEFAULT 0,
  "effortRating" DECIMAL(3,2) DEFAULT 0,
  "tacticalUnderstandingRating" DECIMAL(3,2) DEFAULT 0,
  "consistencyRating" DECIMAL(3,2) DEFAULT 0,
  "playerImprovementRate" DECIMAL(5,2) DEFAULT 0,
  "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("coachId") REFERENCES "Staff" ("userId") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "CoachReputationScoreSnapshot_organizationId_coachId_key" ON "CoachReputationScoreSnapshot"("organizationId", "coachId");
CREATE INDEX "CoachReputationScoreSnapshot_organizationId_idx" ON "CoachReputationScoreSnapshot"("organizationId");
CREATE INDEX "CoachReputationScoreSnapshot_coachId_idx" ON "CoachReputationScoreSnapshot"("coachId");
CREATE INDEX "CoachReputationScoreSnapshot_currentScore_idx" ON "CoachReputationScoreSnapshot"("currentScore" DESC);

-- Overall Index (Combined weighted public profile score)
CREATE TABLE "OverallIndexSnapshot" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "indexScore" INTEGER NOT NULL DEFAULT 0,
  "previousIndexScore" INTEGER,
  "competitiveWeight" DECIMAL(3,2) NOT NULL DEFAULT 0.40,
  "developmentWeight" DECIMAL(3,2) NOT NULL DEFAULT 0.30,
  "activityWeight" DECIMAL(3,2) NOT NULL DEFAULT 0.20,
  "coachReputationWeight" DECIMAL(3,2) NOT NULL DEFAULT 0.10,
  "trend" TEXT DEFAULT 'stable',
  "movement" INTEGER DEFAULT 0,
  "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("playerId") REFERENCES "Player" ("userId") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "OverallIndexSnapshot_organizationId_playerId_key" ON "OverallIndexSnapshot"("organizationId", "playerId");
CREATE INDEX "OverallIndexSnapshot_organizationId_idx" ON "OverallIndexSnapshot"("organizationId");
CREATE INDEX "OverallIndexSnapshot_playerId_idx" ON "OverallIndexSnapshot"("playerId");
CREATE INDEX "OverallIndexSnapshot_indexScore_idx" ON "OverallIndexSnapshot"("indexScore" DESC);

-- Ranking History (Store progression over time)
CREATE TABLE "RankingHistory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "rankingType" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "previousScore" INTEGER,
  "movement" INTEGER DEFAULT 0,
  "reason" TEXT,
  "snapshot" JSON,
  "recordedAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("playerId") REFERENCES "Player" ("userId") ON DELETE CASCADE
);

CREATE INDEX "RankingHistory_organizationId_playerId_idx" ON "RankingHistory"("organizationId", "playerId");
CREATE INDEX "RankingHistory_organizationId_recordedAt_idx" ON "RankingHistory"("organizationId", "recordedAt" DESC);
CREATE INDEX "RankingHistory_rankingType_idx" ON "RankingHistory"("rankingType");
CREATE INDEX "RankingHistory_recordedAt_idx" ON "RankingHistory"("recordedAt" DESC);

-- Ranking Event (Link rankings back to source events for traceability)
CREATE TABLE "RankingEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "impactedDimensions" TEXT NOT NULL,
  "scoreChange" INTEGER DEFAULT 0,
  "reason" TEXT,
  "sourceData" JSON,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("playerId") REFERENCES "Player" ("userId") ON DELETE CASCADE
);

CREATE INDEX "RankingEvent_organizationId_playerId_idx" ON "RankingEvent"("organizationId", "playerId");
CREATE INDEX "RankingEvent_organizationId_eventType_idx" ON "RankingEvent"("organizationId", "eventType");
CREATE INDEX "RankingEvent_eventId_idx" ON "RankingEvent"("eventId");
CREATE INDEX "RankingEvent_createdAt_idx" ON "RankingEvent"("createdAt" DESC);

-- Leaderboard Projection (Optimized views for performance)
CREATE TABLE "LeaderboardProjection" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "leaderboardType" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "rank" INTEGER NOT NULL,
  "score" INTEGER NOT NULL,
  "displayName" TEXT NOT NULL,
  "metadata" JSON,
  "lastProjectedAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("playerId") REFERENCES "Player" ("userId") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "LeaderboardProjection_organizationId_leaderboardType_playerId_key" ON "LeaderboardProjection"("organizationId", "leaderboardType", "playerId");
CREATE INDEX "LeaderboardProjection_organizationId_leaderboardType_rank_idx" ON "LeaderboardProjection"("organizationId", "leaderboardType", "rank");
CREATE INDEX "LeaderboardProjection_leaderboardType_idx" ON "LeaderboardProjection"("leaderboardType");
CREATE INDEX "LeaderboardProjection_lastProjectedAt_idx" ON "LeaderboardProjection"("lastProjectedAt" DESC);

-- Add ranking events to DomainEventType
-- (This will be handled in the DomainEvent.ts file)
