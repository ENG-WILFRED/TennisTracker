-- CreateTable
CREATE TABLE "public"."MatchReport" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "refereeId" TEXT NOT NULL,
    "pdfContent" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MatchReport_matchId_key" ON "public"."MatchReport"("matchId");

-- CreateIndex
CREATE INDEX "MatchReport_matchId_idx" ON "public"."MatchReport"("matchId");

-- CreateIndex
CREATE INDEX "MatchReport_refereeId_idx" ON "public"."MatchReport"("refereeId");

-- CreateIndex
CREATE INDEX "MatchReport_generatedAt_idx" ON "public"."MatchReport"("generatedAt");

-- AddForeignKey
ALTER TABLE "public"."MatchReport" ADD CONSTRAINT "MatchReport_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MatchReport" ADD CONSTRAINT "MatchReport_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "public"."Referee"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
