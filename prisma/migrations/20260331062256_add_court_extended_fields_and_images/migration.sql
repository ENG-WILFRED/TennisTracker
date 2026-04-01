-- AlterTable
ALTER TABLE "public"."Court" ADD COLUMN     "address" TEXT,
ADD COLUMN     "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "availableDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "city" TEXT,
ADD COLUMN     "closeTime" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "lastInspectionDate" TIMESTAMP(3),
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "length" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "maxCapacity" INTEGER,
ADD COLUMN     "nextMaintenanceDate" TIMESTAMP(3),
ADD COLUMN     "offPeakPrice" DOUBLE PRECISION,
ADD COLUMN     "openTime" TEXT,
ADD COLUMN     "peakHourEnd" TEXT,
ADD COLUMN     "peakHourStart" TEXT,
ADD COLUMN     "peakPrice" DOUBLE PRECISION,
ADD COLUMN     "renovationYear" INTEGER,
ADD COLUMN     "rules" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "width" DOUBLE PRECISION,
ADD COLUMN     "yearBuilt" INTEGER;

-- CreateTable
CREATE TABLE "public"."CourtImage" (
    "id" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "posX" DOUBLE PRECISION DEFAULT 0,
    "posY" DOUBLE PRECISION DEFAULT 0,
    "scale" DOUBLE PRECISION DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourtImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourtImage_courtId_idx" ON "public"."CourtImage"("courtId");

-- CreateIndex
CREATE INDEX "CourtImage_order_courtId_idx" ON "public"."CourtImage"("order", "courtId");

-- AddForeignKey
ALTER TABLE "public"."CourtImage" ADD CONSTRAINT "CourtImage_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "public"."Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;
