-- CreateTable
CREATE TABLE "public"."PaymentReminder" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "reminderType" TEXT NOT NULL DEFAULT 'payment',
    "message" TEXT,
    "sentAt" TIMESTAMP(3),
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentReminder_eventId_idx" ON "public"."PaymentReminder"("eventId");

-- CreateIndex
CREATE INDEX "PaymentReminder_memberId_idx" ON "public"."PaymentReminder"("memberId");

-- CreateIndex
CREATE INDEX "PaymentReminder_isRead_idx" ON "public"."PaymentReminder"("isRead");

-- AddForeignKey
ALTER TABLE "public"."PaymentReminder" ADD CONSTRAINT "PaymentReminder_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."ClubEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentReminder" ADD CONSTRAINT "PaymentReminder_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."ClubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentReminder" ADD CONSTRAINT "PaymentReminder_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "public"."EventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
