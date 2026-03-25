/*
  Warnings:

  - You are about to drop the column `likes` on the `PostComment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."ClubEvent" ADD COLUMN     "courtInfo" TEXT,
ADD COLUMN     "eatingAreas" TEXT,
ADD COLUMN     "instructions" TEXT,
ADD COLUMN     "rules" TEXT,
ADD COLUMN     "sleepingAreas" TEXT;

-- AlterTable
ALTER TABLE "public"."PostComment" DROP COLUMN "likes",
ADD COLUMN     "parentCommentId" TEXT;

-- CreateTable
CREATE TABLE "public"."CommentReaction" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'like',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventAmenity" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "capacity" INTEGER,
    "price" DOUBLE PRECISION,
    "availableFrom" TIMESTAMP(3),
    "availableUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventAmenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AmenityBooking" (
    "id" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,
    "memberId" TEXT,
    "guestName" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "price" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmenityBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommentReaction_commentId_idx" ON "public"."CommentReaction"("commentId");

-- CreateIndex
CREATE INDEX "CommentReaction_userId_idx" ON "public"."CommentReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentReaction_commentId_userId_key" ON "public"."CommentReaction"("commentId", "userId");

-- CreateIndex
CREATE INDEX "EventAmenity_eventId_idx" ON "public"."EventAmenity"("eventId");

-- CreateIndex
CREATE INDEX "AmenityBooking_amenityId_idx" ON "public"."AmenityBooking"("amenityId");

-- CreateIndex
CREATE INDEX "AmenityBooking_memberId_idx" ON "public"."AmenityBooking"("memberId");

-- CreateIndex
CREATE INDEX "PostComment_parentCommentId_idx" ON "public"."PostComment"("parentCommentId");

-- AddForeignKey
ALTER TABLE "public"."PostComment" ADD CONSTRAINT "PostComment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "public"."PostComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommentReaction" ADD CONSTRAINT "CommentReaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "public"."PostComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommentReaction" ADD CONSTRAINT "CommentReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventAmenity" ADD CONSTRAINT "EventAmenity_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AmenityBooking" ADD CONSTRAINT "AmenityBooking_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "public"."EventAmenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AmenityBooking" ADD CONSTRAINT "AmenityBooking_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."ClubMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
