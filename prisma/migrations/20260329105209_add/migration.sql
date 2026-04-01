-- AlterTable
ALTER TABLE "public"."EventReminder" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "public"."CourtComment" (
    "id" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "bookingId" TEXT,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "rating" INTEGER DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourtComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourtComplaint" (
    "id" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "bookingId" TEXT,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resolvedNotes" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourtComplaint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourtComment_courtId_idx" ON "public"."CourtComment"("courtId");

-- CreateIndex
CREATE INDEX "CourtComment_bookingId_idx" ON "public"."CourtComment"("bookingId");

-- CreateIndex
CREATE INDEX "CourtComment_authorId_idx" ON "public"."CourtComment"("authorId");

-- CreateIndex
CREATE INDEX "CourtComment_createdAt_idx" ON "public"."CourtComment"("createdAt");

-- CreateIndex
CREATE INDEX "CourtComplaint_courtId_idx" ON "public"."CourtComplaint"("courtId");

-- CreateIndex
CREATE INDEX "CourtComplaint_bookingId_idx" ON "public"."CourtComplaint"("bookingId");

-- CreateIndex
CREATE INDEX "CourtComplaint_authorId_idx" ON "public"."CourtComplaint"("authorId");

-- CreateIndex
CREATE INDEX "CourtComplaint_status_idx" ON "public"."CourtComplaint"("status");

-- CreateIndex
CREATE INDEX "CourtComplaint_createdAt_idx" ON "public"."CourtComplaint"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."CourtComment" ADD CONSTRAINT "CourtComment_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "public"."Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourtComment" ADD CONSTRAINT "CourtComment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."CourtBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourtComment" ADD CONSTRAINT "CourtComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourtComplaint" ADD CONSTRAINT "CourtComplaint_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "public"."Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourtComplaint" ADD CONSTRAINT "CourtComplaint_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."CourtBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourtComplaint" ADD CONSTRAINT "CourtComplaint_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
