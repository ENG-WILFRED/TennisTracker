-- CreateTable
CREATE TABLE "public"."TournamentAnnouncement" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "announcementType" TEXT NOT NULL DEFAULT 'general',
    "createdBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "readBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TournamentAnnouncement_eventId_idx" ON "public"."TournamentAnnouncement"("eventId");

-- CreateIndex
CREATE INDEX "TournamentAnnouncement_organizationId_idx" ON "public"."TournamentAnnouncement"("organizationId");

-- CreateIndex
CREATE INDEX "TournamentAnnouncement_createdAt_idx" ON "public"."TournamentAnnouncement"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."TournamentAnnouncement" ADD CONSTRAINT "TournamentAnnouncement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentAnnouncement" ADD CONSTRAINT "TournamentAnnouncement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
