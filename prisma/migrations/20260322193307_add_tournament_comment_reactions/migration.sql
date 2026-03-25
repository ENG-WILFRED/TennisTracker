-- CreateTable
CREATE TABLE "public"."TournamentCommentReaction" (
    "id" TEXT NOT NULL,
    "tournamentCommentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'like',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentCommentReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TournamentCommentReaction_tournamentCommentId_idx" ON "public"."TournamentCommentReaction"("tournamentCommentId");

-- CreateIndex
CREATE INDEX "TournamentCommentReaction_userId_idx" ON "public"."TournamentCommentReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentCommentReaction_tournamentCommentId_userId_key" ON "public"."TournamentCommentReaction"("tournamentCommentId", "userId");

-- AddForeignKey
ALTER TABLE "public"."TournamentCommentReaction" ADD CONSTRAINT "TournamentCommentReaction_tournamentCommentId_fkey" FOREIGN KEY ("tournamentCommentId") REFERENCES "public"."TournamentComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentCommentReaction" ADD CONSTRAINT "TournamentCommentReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
