import { NextRequest, NextResponse } from 'next/server';
import { handlePaymentCallback } from '@/actions/payments';
import prisma from '@/lib/prisma';

/**
 * M-Pesa Payment Callback Handler
 * Receives STK push completion callbacks from M-Pesa
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    console.log('M-Pesa callback received:', data);

    const transactionId = data.transactionId;
    const resultCode = data.resultCode;

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

    // Process the payment
    const result = await handlePaymentCallback('mpesa', {
      transactionId,
      resultCode,
      resultDesc: data.resultDesc,
      id: data.mpesaReceiptNumber,
    });

    // Send callback notification if registered
    if (record.callbackUrl && (resultCode === '0' || resultCode === 0)) {
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
            gateway: 'mpesa',
            status: 'completed',
            transactionId: data.mpesaReceiptNumber,
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
      console.error('M-Pesa callback processing failed:', result.error);
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Callback processed' });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Callback processing failed' },
      { status: 500 }
    );
  }
}
