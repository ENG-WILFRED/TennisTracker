-- CreateTable
CREATE TABLE "public"."ResourceRequest" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedByUserId" TEXT,
    "approvalNotes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResourceRequest_taskId_idx" ON "public"."ResourceRequest"("taskId");

-- CreateIndex
CREATE INDEX "ResourceRequest_requestedByUserId_idx" ON "public"."ResourceRequest"("requestedByUserId");

-- CreateIndex
CREATE INDEX "ResourceRequest_status_idx" ON "public"."ResourceRequest"("status");

-- CreateIndex
CREATE INDEX "ResourceRequest_requestedAt_idx" ON "public"."ResourceRequest"("requestedAt");

-- AddForeignKey
ALTER TABLE "public"."ResourceRequest" ADD CONSTRAINT "ResourceRequest_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ResourceRequest" ADD CONSTRAINT "ResourceRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ResourceRequest" ADD CONSTRAINT "ResourceRequest_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
