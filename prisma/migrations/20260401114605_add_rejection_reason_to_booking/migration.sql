-- AlterTable
ALTER TABLE "public"."CourtBooking" ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT;
