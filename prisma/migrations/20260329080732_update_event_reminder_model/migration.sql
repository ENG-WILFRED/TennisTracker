/*
  Warnings:

  - You are about to drop the column `reminderText` on the `EventReminder` table. All the data in the column will be lost.
  - You are about to drop the column `scheduleTime` on the `EventReminder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."EventReminder" DROP COLUMN "reminderText",
DROP COLUMN "scheduleTime",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "remindTime" TIMESTAMP(3),
ADD COLUMN     "reminderType" TEXT NOT NULL DEFAULT 'email',
ADD COLUMN     "title" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "EventReminder_eventId_idx" ON "public"."EventReminder"("eventId");
