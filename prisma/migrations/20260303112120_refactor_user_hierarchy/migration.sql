/*
  Warnings:

  - The primary key for the `Player` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `bio` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `dateOfBirth` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `nationality` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `photo` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `Player` table. All the data in the column will be lost.
  - The primary key for the `Referee` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `bio` on the `Referee` table. All the data in the column will be lost.
  - You are about to drop the column `dateOfBirth` on the `Referee` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Referee` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `Referee` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `Referee` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Referee` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `Referee` table. All the data in the column will be lost.
  - You are about to drop the column `nationality` on the `Referee` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `Referee` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Referee` table. All the data in the column will be lost.
  - You are about to drop the column `photo` on the `Referee` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `Referee` table. All the data in the column will be lost.
  - The primary key for the `Staff` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `email` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `nationality` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `photo` on the `Staff` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Player` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Referee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Staff` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Attendance" DROP CONSTRAINT "Attendance_playerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AuditLog" DROP CONSTRAINT "AuditLog_staffId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Availability" DROP CONSTRAINT "Availability_staffId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Certification" DROP CONSTRAINT "Certification_staffId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ChatMessage" DROP CONSTRAINT "ChatMessage_playerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ChatParticipant" DROP CONSTRAINT "ChatParticipant_playerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClubMember" DROP CONSTRAINT "ClubMember_playerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CoachPricing" DROP CONSTRAINT "CoachPricing_staffId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CoachReview" DROP CONSTRAINT "CoachReview_staffId_fkey";

-- DropForeignKey
ALTER TABLE "public"."InventoryItem" DROP CONSTRAINT "InventoryItem_clubId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Match" DROP CONSTRAINT "Match_playerAId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Match" DROP CONSTRAINT "Match_playerBId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Match" DROP CONSTRAINT "Match_refereeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Match" DROP CONSTRAINT "Match_winnerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MatchBallCrew" DROP CONSTRAINT "MatchBallCrew_playerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MatchBallCrew" DROP CONSTRAINT "MatchBallCrew_refereeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PerformancePoint" DROP CONSTRAINT "PerformancePoint_playerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PlayerBadge" DROP CONSTRAINT "PlayerBadge_playerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Specialization" DROP CONSTRAINT "Specialization_staffId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Staff" DROP CONSTRAINT "Staff_employedById_fkey";

-- DropIndex
DROP INDEX "public"."Player_email_key";

-- DropIndex
DROP INDEX "public"."Player_phone_key";

-- DropIndex
DROP INDEX "public"."Player_username_key";

-- DropIndex
DROP INDEX "public"."Referee_email_key";

-- DropIndex
DROP INDEX "public"."Referee_phone_key";

-- DropIndex
DROP INDEX "public"."Referee_username_key";

-- Drop constraint created by unique index on Staff.email
   ALTER TABLE "public"."Staff" DROP CONSTRAINT IF EXISTS "Staff_email_key";
   -- DropIndex
   DROP INDEX IF EXISTS "public"."Staff_email_key";
  -- migrate data out of the old columns
  -- CreateTable
  CREATE TABLE "public"."User" (
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
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,

      CONSTRAINT "User_pkey" PRIMARY KEY ("id")
  );

  -- copy data from existing profiles into users
  INSERT INTO "public"."User" ("id","username","email","phone","passwordHash","firstName","lastName","photo","gender","dateOfBirth","nationality","bio","createdAt","updatedAt")
    SELECT "id","username","email","phone","passwordHash","firstName","lastName","photo","gender","dateOfBirth","nationality","bio","createdAt","updatedAt" FROM "public"."Player";
  INSERT INTO "public"."User" ("id","username","email","phone","passwordHash","firstName","lastName","photo","gender","dateOfBirth","nationality","bio","createdAt","updatedAt")
    SELECT "id","username","email","phone","passwordHash","firstName","lastName","photo","gender","dateOfBirth","nationality","bio","createdAt","updatedAt" FROM "public"."Referee";
  INSERT INTO "public"."User" ("id","username","email","phone","passwordHash","firstName","lastName","photo","gender","dateOfBirth","nationality","bio","createdAt","updatedAt")
    SELECT "id", "name", "email", "phone", ''::text AS "passwordHash", ''::text AS "firstName", ''::text AS "lastName", "photo", "gender", NULL, NULL, NULL, "createdAt", "updatedAt" FROM "public"."Staff";

  -- now mutate Player records: add userId column and populate it
  ALTER TABLE "public"."Player" ADD COLUMN "userId" TEXT;
  UPDATE "public"."Player" SET "userId" = "id";
  ALTER TABLE "public"."Player" ALTER COLUMN "userId" SET NOT NULL;
  -- keep old values until after copy, then drop them and re-create primary key
  ALTER TABLE "public"."Player" DROP CONSTRAINT "Player_pkey",
      DROP COLUMN "bio",
      DROP COLUMN "dateOfBirth",
      DROP COLUMN "email",
      DROP COLUMN "firstName",
      DROP COLUMN "gender",
      DROP COLUMN "id",
      DROP COLUMN "lastName",
      DROP COLUMN "nationality",
      DROP COLUMN "passwordHash",
      DROP COLUMN "phone",
      DROP COLUMN "photo",
      DROP COLUMN "username",
      ADD CONSTRAINT "Player_pkey" PRIMARY KEY ("userId");

-- Referee: keep id temporarily so we can populate userId
  ALTER TABLE "public"."Referee" ADD COLUMN "userId" TEXT;
  UPDATE "public"."Referee" SET "userId" = "id";
  ALTER TABLE "public"."Referee" ALTER COLUMN "userId" SET NOT NULL;
  ALTER TABLE "public"."Referee" DROP CONSTRAINT "Referee_pkey",
      DROP COLUMN "bio",
      DROP COLUMN "dateOfBirth",
      DROP COLUMN "email",
      DROP COLUMN "firstName",
      DROP COLUMN "gender",
      DROP COLUMN "id",
      DROP COLUMN "lastName",
      DROP COLUMN "nationality",
      DROP COLUMN "passwordHash",
      DROP COLUMN "phone",
      DROP COLUMN "photo",
      DROP COLUMN "username",
      ADD CONSTRAINT "Referee_pkey" PRIMARY KEY ("userId");

-- Staff: add userId and populate from existing id
  ALTER TABLE "public"."Staff" ADD COLUMN "userId" TEXT;
  UPDATE "public"."Staff" SET "userId" = "id";
  ALTER TABLE "public"."Staff" ALTER COLUMN "userId" SET NOT NULL;
  ALTER TABLE "public"."Staff" DROP CONSTRAINT "Staff_pkey",
      DROP COLUMN "email",
      DROP COLUMN "gender",
      DROP COLUMN "id",
      DROP COLUMN "name",
      DROP COLUMN "nationality",
      DROP COLUMN "phone",
      DROP COLUMN "photo",
      ADD CONSTRAINT "Staff_pkey" PRIMARY KEY ("userId");


-- CreateTable
CREATE TABLE "public"."Spectator" (
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Spectator_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "public"."User"("phone");

-- AddForeignKey
ALTER TABLE "public"."Player" ADD CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryItem" ADD CONSTRAINT "InventoryItem_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "public"."Player"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Referee" ADD CONSTRAINT "Referee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Staff" ADD CONSTRAINT "Staff_employedById_fkey" FOREIGN KEY ("employedById") REFERENCES "public"."Player"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Spectator" ADD CONSTRAINT "Spectator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Certification" ADD CONSTRAINT "Certification_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Specialization" ADD CONSTRAINT "Specialization_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Availability" ADD CONSTRAINT "Availability_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoachPricing" ADD CONSTRAINT "CoachPricing_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoachReview" ADD CONSTRAINT "CoachReview_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_playerAId_fkey" FOREIGN KEY ("playerAId") REFERENCES "public"."Player"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_playerBId_fkey" FOREIGN KEY ("playerBId") REFERENCES "public"."Player"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "public"."Referee"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "public"."Player"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MatchBallCrew" ADD CONSTRAINT "MatchBallCrew_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MatchBallCrew" ADD CONSTRAINT "MatchBallCrew_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "public"."Referee"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlayerBadge" ADD CONSTRAINT "PlayerBadge_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PerformancePoint" ADD CONSTRAINT "PerformancePoint_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatMessage" ADD CONSTRAINT "ChatMessage_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatParticipant" ADD CONSTRAINT "ChatParticipant_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClubMember" ADD CONSTRAINT "ClubMember_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
