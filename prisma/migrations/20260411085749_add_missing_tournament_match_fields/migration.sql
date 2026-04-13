-- AlterTable
ALTER TABLE "public"."TournamentMatch" ADD COLUMN     "lastResetAt" TIMESTAMP(3),
ADD COLUMN     "lastResetReason" TEXT,
ADD COLUMN     "servingPlayerId" TEXT;
