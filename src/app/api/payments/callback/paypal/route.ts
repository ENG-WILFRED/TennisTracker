import { NextRequest, NextResponse } from 'next/server';
import { handlePaymentCallback } from '@/actions/payments';
import prisma from '@/lib/prisma';

/**
 * PayPal Payment Callback Handler
 * Receives IPN (Instant Payment Notification) callbacks from PayPal
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const data = Object.fromEntries(formData);

    console.log('PayPal IPN callback received:', data);

    const transactionId = data.custom as string;

    // Get the payment record to access callback URL
    const record = await prisma.paymentRecord.findUnique({
      where: { id: transactionId },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 400 }
      );
    }

    // Verify the IPN authenticity with PayPal
    const verifyResponse = await fetch(
      process.env.NEXT_PUBLIC_PAYPAL_SANDBOX === 'true'
        ? 'https://www.sandbox.paypal.com/cgi-bin/webscr'
        : 'https://www.paypal.com/cgi-bin/webscr',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          cmd: '_notify-validate',
          ...Object.fromEntries(formData),
        }).toString(),
      }
    );

    const verifyText = await verifyResponse.text();
    if (verifyText !== 'VERIFIED') {
      console.warn('PayPal IPN verification failed');
      return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 400 });
    }

    const result = await handlePaymentCallback('paypal', {
      transactionId,
      status: data.payment_status,
      orderId: data.txn_id,
      id: data.txn_id,
      amount: data.mc_gross,
    });

    // Send callback notification if registered and payment completed
    if (record.callbackUrl && ['Completed', 'COMPLETED'].includes(String(data.payment_status))) {
      try {
        await fetch(record.callbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Payment-Callback': 'true',
            'X-Callback-Version': '1.0',
          },
          body: JSON.stringify({
            idempotencyKey: transactionId,
            gateway: 'paypal',
            status: 'completed',
            transactionId: data.txn_id,
            amount: record.amount,
            currency: record.currency,
            timestamp: new Date().toISOString(),
            error: null,
            metadata: JSON.parse(record.metadata || '{}'),
          }),
        }).catch(err => console.error('Callback notification send failed:', err));
      } catch (error) {
        console.error('Error sending callback notification:', error);
      }
    }

    if (!result.success) {
      console.error('PayPal callback processing failed:', result.error);
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Callback processed' });
  } catch (error) {
    console.error('PayPal callback error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Callback processing failed' },
      { status: 500 }
    );
  }
}
