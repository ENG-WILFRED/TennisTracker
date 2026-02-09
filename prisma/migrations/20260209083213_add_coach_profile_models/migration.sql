-- AlterTable
ALTER TABLE "Staff" ADD COLUMN "email" TEXT UNIQUE,
ADD COLUMN "phone" TEXT,
ADD COLUMN "gender" TEXT,
ADD COLUMN "nationality" TEXT,
ADD COLUMN "yearsOfExperience" INTEGER DEFAULT 0,
ADD COLUMN "coachingLevel" TEXT,
ADD COLUMN "formerPlayerBackground" TEXT,
ADD COLUMN "playerAgeGroups" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "skillLevelsTrained" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "trainingTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "languagesSpoken" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "sessionDurations" INTEGER[] DEFAULT ARRAY[30, 60, 90]::INTEGER[],
ADD COLUMN "maxStudentsPerSession" INTEGER DEFAULT 1,
ADD COLUMN "courtLocations" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "bio" TEXT,
ADD COLUMN "coachingPhilosophy" TEXT,
ADD COLUMN "achievements" TEXT,
ADD COLUMN "introVideoUrl" TEXT,
ADD COLUMN "studentCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "ownerId" TEXT;

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specialization" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT,
    "yearsOfFocus" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Specialization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachPricing" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "pricePerSession" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "package3Sessions" DOUBLE PRECISION,
    "package10Sessions" DOUBLE PRECISION,
    "juniorDiscount" DOUBLE PRECISION DEFAULT 0,
    "groupSessionDiscount" DOUBLE PRECISION DEFAULT 0,
    "commissionRate" DOUBLE PRECISION DEFAULT 0,
    "paymentMethods" TEXT[] DEFAULT ARRAY['credit_card', 'bank_transfer']::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachReview" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "reviewText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Certification_staffId_name_key" ON "Certification"("staffId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Specialization_staffId_name_key" ON "Specialization"("staffId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Availability_staffId_dayOfWeek_startTime_key" ON "Availability"("staffId", "dayOfWeek", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "CoachPricing_staffId_key" ON "CoachPricing"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachReview_staffId_playerId_key" ON "CoachReview"("staffId", "playerId");

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specialization" ADD CONSTRAINT "Specialization_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachPricing" ADD CONSTRAINT "CoachPricing_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachReview" ADD CONSTRAINT "CoachReview_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
