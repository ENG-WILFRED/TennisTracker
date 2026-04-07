-- CreateTable
CREATE TABLE "public"."Activity" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activity_coachId_idx" ON "public"."Activity"("coachId");

-- CreateIndex
CREATE INDEX "Activity_date_idx" ON "public"."Activity"("date");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "public"."Activity"("type");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "public"."Activity"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."Activity" ADD CONSTRAINT "Activity_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "public"."Staff"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
