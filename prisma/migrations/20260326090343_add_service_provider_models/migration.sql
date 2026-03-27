/*
  Warnings:

  - You are about to drop the column `contactEmail` on the `ProviderProfile` table. All the data in the column will be lost.
  - You are about to drop the column `serviceCategories` on the `ProviderProfile` table. All the data in the column will be lost.
  - You are about to drop the column `contextId` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `externalUrl` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `serviceType` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `respondedAt` on the `ServiceBooking` table. All the data in the column will be lost.
  - You are about to drop the column `respondedBy` on the `ServiceBooking` table. All the data in the column will be lost.
  - Made the column `description` on table `ProviderProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "public"."ProviderProfile_isActive_idx";

-- DropIndex
DROP INDEX "public"."ProviderProfile_userId_idx";

-- DropIndex
DROP INDEX "public"."Service_category_idx";

-- DropIndex
DROP INDEX "public"."Service_contextId_idx";

-- DropIndex
DROP INDEX "public"."Service_contextType_idx";

-- DropIndex
DROP INDEX "public"."Service_isActive_idx";

-- DropIndex
DROP INDEX "public"."ServiceBooking_contextId_idx";

-- DropIndex
DROP INDEX "public"."ServiceBooking_contextType_idx";

-- DropIndex
DROP INDEX "public"."ServiceBooking_status_idx";

-- AlterTable
ALTER TABLE "public"."ProviderProfile" DROP COLUMN "contactEmail",
DROP COLUMN "serviceCategories",
ADD COLUMN     "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "organizationId" TEXT,
ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Service" DROP COLUMN "contextId",
DROP COLUMN "externalUrl",
DROP COLUMN "serviceType",
ADD COLUMN     "externalLink" TEXT,
ADD COLUMN     "sourceType" TEXT NOT NULL DEFAULT 'internal',
ADD COLUMN     "tournamentId" TEXT,
ALTER COLUMN "providerId" DROP NOT NULL,
ALTER COLUMN "contextType" SET DEFAULT 'both';

-- AlterTable
ALTER TABLE "public"."ServiceBooking" DROP COLUMN "respondedAt",
DROP COLUMN "respondedBy",
ALTER COLUMN "providerId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "ProviderProfile_organizationId_idx" ON "public"."ProviderProfile"("organizationId");

-- CreateIndex
CREATE INDEX "Service_tournamentId_idx" ON "public"."Service"("tournamentId");

-- AddForeignKey
ALTER TABLE "public"."ProviderProfile" ADD CONSTRAINT "ProviderProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Service" ADD CONSTRAINT "Service_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "public"."ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
