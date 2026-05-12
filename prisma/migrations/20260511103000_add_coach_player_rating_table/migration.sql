-- Create table for coach ratings of players
CREATE TABLE "public"."CoachPlayerRating" (
  "id" TEXT NOT NULL,
  "coachId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "sessionId" TEXT,
  "overallRating" DOUBLE PRECISION NOT NULL,
  "techniquRating" DOUBLE PRECISION,
  "mentalRating" DOUBLE PRECISION,
  "fitnessRating" DOUBLE PRECISION,
  "teamworkRating" DOUBLE PRECISION,
  "strengths" TEXT,
  "areasForImprovement" TEXT,
  "notes" TEXT,
  "sessionType" TEXT,
  "trainingFocus" TEXT,
  "isConcluded" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CoachPlayerRating_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CoachPlayerRating_coachId_idx" ON "public"."CoachPlayerRating"("coachId");
CREATE INDEX "CoachPlayerRating_playerId_idx" ON "public"."CoachPlayerRating"("playerId");
CREATE INDEX "CoachPlayerRating_sessionId_idx" ON "public"."CoachPlayerRating"("sessionId");
CREATE INDEX "CoachPlayerRating_createdAt_idx" ON "public"."CoachPlayerRating"("createdAt");
CREATE INDEX "CoachPlayerRating_isConcluded_idx" ON "public"."CoachPlayerRating"("isConcluded");

ALTER TABLE "public"."CoachPlayerRating"
  ADD CONSTRAINT "CoachPlayerRating_coachId_fkey"
  FOREIGN KEY ("coachId") REFERENCES "public"."Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."CoachPlayerRating"
  ADD CONSTRAINT "CoachPlayerRating_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "public"."Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."CoachPlayerRating"
  ADD CONSTRAINT "CoachPlayerRating_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "public"."CoachSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
