-- CreateTable
CREATE TABLE "public"."OrganizationActivity" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrganizationActivity_organizationId_createdAt_idx" ON "public"."OrganizationActivity"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "OrganizationActivity_playerId_idx" ON "public"."OrganizationActivity"("playerId");

-- AddForeignKey
ALTER TABLE "public"."OrganizationActivity" ADD CONSTRAINT "OrganizationActivity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrganizationActivity" ADD CONSTRAINT "OrganizationActivity_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
