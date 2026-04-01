-- CreateTable
CREATE TABLE "public"."EventTask" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "serviceId" TEXT,
    "staffUserId" TEXT,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "role" TEXT NOT NULL,
    "responsibility" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventTask_eventId_idx" ON "public"."EventTask"("eventId");

-- CreateIndex
CREATE INDEX "EventTask_organizationId_idx" ON "public"."EventTask"("organizationId");

-- CreateIndex
CREATE INDEX "EventTask_serviceId_idx" ON "public"."EventTask"("serviceId");

-- CreateIndex
CREATE INDEX "EventTask_staffUserId_idx" ON "public"."EventTask"("staffUserId");

-- CreateIndex
CREATE INDEX "EventTask_status_idx" ON "public"."EventTask"("status");

-- CreateIndex
CREATE INDEX "EventTask_createdAt_idx" ON "public"."EventTask"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."EventTask" ADD CONSTRAINT "EventTask_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventTask" ADD CONSTRAINT "EventTask_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventTask" ADD CONSTRAINT "EventTask_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventTask" ADD CONSTRAINT "EventTask_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "public"."Staff"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
