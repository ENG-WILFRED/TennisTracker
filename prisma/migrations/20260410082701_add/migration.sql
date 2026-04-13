-- DropForeignKey
ALTER TABLE "public"."TaskHistory" DROP CONSTRAINT "TaskHistory_changedByUserId_fkey";

-- CreateTable
CREATE TABLE "public"."NotificationLog" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,
    "nextRetryAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationLog_taskId_idx" ON "public"."NotificationLog"("taskId");

-- CreateIndex
CREATE INDEX "NotificationLog_recipientEmail_idx" ON "public"."NotificationLog"("recipientEmail");

-- CreateIndex
CREATE INDEX "NotificationLog_status_idx" ON "public"."NotificationLog"("status");

-- CreateIndex
CREATE INDEX "NotificationLog_nextRetryAt_idx" ON "public"."NotificationLog"("nextRetryAt");

-- CreateIndex
CREATE INDEX "NotificationLog_createdAt_idx" ON "public"."NotificationLog"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."TaskHistory" ADD CONSTRAINT "TaskHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationLog" ADD CONSTRAINT "NotificationLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
