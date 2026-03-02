/*
  Warnings:

  - You are about to drop the column `details` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `matchesBallCrew` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `matchesRefereed` on the `Player` table. All the data in the column will be lost.

*/
ALTER TABLE "public"."Match" DROP CONSTRAINT IF EXISTS "Match_refereeId_fkey";

ALTER TABLE "public"."MatchBallCrew" ADD COLUMN     "refereeId" TEXT;

-- AlterTable
ALTER TABLE "public"."Player" DROP COLUMN IF EXISTS "matchesBallCrew",
DROP COLUMN IF EXISTS "matchesRefereed";

-- CreateTable
CREATE TABLE "public"."Referee" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "photo" TEXT,
    "gender" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "nationality" TEXT,
    "bio" TEXT,
    "matchesRefereed" INTEGER NOT NULL DEFAULT 0,
    "ballCrewMatches" INTEGER NOT NULL DEFAULT 0,
    "experience" TEXT,
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Referee_username_key" ON "public"."Referee"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Referee_email_key" ON "public"."Referee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Referee_phone_key" ON "public"."Referee"("phone");

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "public"."Referee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MatchBallCrew" ADD CONSTRAINT "MatchBallCrew_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "public"."Referee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
