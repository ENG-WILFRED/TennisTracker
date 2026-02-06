-- DropForeignKey
ALTER TABLE "public"."Match" DROP CONSTRAINT "Match_refereeId_fkey";

-- AlterTable
ALTER TABLE "public"."Match" ALTER COLUMN "refereeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Match" ADD CONSTRAINT "Match_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "public"."Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
