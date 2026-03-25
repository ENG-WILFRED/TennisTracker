-- CreateTable
CREATE TABLE "public"."TournamentComment" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentCommentId" TEXT,

    CONSTRAINT "TournamentComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TournamentComment_eventId_idx" ON "public"."TournamentComment"("eventId");

-- CreateIndex
CREATE INDEX "TournamentComment_authorId_idx" ON "public"."TournamentComment"("authorId");

-- CreateIndex
CREATE INDEX "TournamentComment_parentCommentId_idx" ON "public"."TournamentComment"("parentCommentId");

-- AddForeignKey
ALTER TABLE "public"."TournamentComment" ADD CONSTRAINT "TournamentComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentComment" ADD CONSTRAINT "TournamentComment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "public"."TournamentComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentComment" ADD CONSTRAINT "TournamentComment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
