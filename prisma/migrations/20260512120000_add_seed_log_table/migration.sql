-- Create SeedLog table for seeding checkpoint state
CREATE TABLE "public"."SeedLog" (
  "id" TEXT NOT NULL,
  "seedName" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "error" TEXT,
  "recordsCreated" INTEGER NOT NULL DEFAULT 0,
  "version" TEXT NOT NULL DEFAULT '1.0',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SeedLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SeedLog_seedName_unique" ON "public"."SeedLog"("seedName");
CREATE INDEX "SeedLog_status_idx" ON "public"."SeedLog"("status");
CREATE INDEX "SeedLog_seedName_idx" ON "public"."SeedLog"("seedName");
CREATE INDEX "SeedLog_createdAt_idx" ON "public"."SeedLog"("createdAt");
