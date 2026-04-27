-- AddCallbackAndCancelUrlsToPaymentRecord
-- Add callback and cancel URL columns to PaymentRecord table

ALTER TABLE "PaymentRecord" ADD COLUMN "callbackUrl" TEXT;
ALTER TABLE "PaymentRecord" ADD COLUMN "cancelUrl" TEXT;

-- Create indexes for faster lookups
CREATE INDEX "idx_payment_record_callback_url" ON "PaymentRecord"("callbackUrl");
CREATE INDEX "idx_payment_record_cancel_url" ON "PaymentRecord"("cancelUrl");
