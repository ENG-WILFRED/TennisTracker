import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Cancel Stripe Payment Intent
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params;
    const { reason = 'User initiated' } = await req.json();

    const record = await prisma.paymentRecord.findUnique({
      where: { id: transactionId },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (record.provider !== 'stripe') {
      return NextResponse.json(
        { success: false, error: 'Invalid provider for this endpoint' },
        { status: 400 }
      );
    }

    // Call Stripe gateway to cancel payment intent
    if (record.providerTransactionId) {
      try {
        const cancelResponse = await fetch(
          `https://payment-gateway.kimaniwilfred95.workers.dev/api/payments/stripe/${record.providerTransactionId}/cancel`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason }),
          }
        );

        if (!cancelResponse.ok) {
          console.error('Stripe cancel failed:', await cancelResponse.json());
        }
      } catch (error) {
        console.error('Error calling Stripe cancel endpoint:', error);
      }
    }

    // Update payment record to cancelled
    await prisma.paymentRecord.update({
      where: { id: transactionId },
      data: {
        providerStatus: 'cancelled',
        metadata: JSON.stringify({
          ...JSON.parse(record.metadata || '{}'),
          cancelledAt: new Date().toISOString(),
          cancelReason: reason,
        }),
      },
    });

    // Send cancel notification if URL exists
    if (record.cancelUrl) {
      try {
        await fetch(record.cancelUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Payment-Cancel': 'true',
            'X-Cancel-Version': '1.0',
          },
          body: JSON.stringify({
            idempotencyKey: transactionId,
            gateway: 'stripe',
            transactionId: record.providerTransactionId,
            reason,
            timestamp: new Date().toISOString(),
            metadata: JSON.parse(record.metadata || '{}'),
          }),
        }).catch(err => console.error('Cancel notification send failed:', err));
      } catch (error) {
        console.error('Error sending cancel notification:', error);
      }
    }

    return NextResponse.json({
      success: true,
      transactionId,
      sessionId: record.providerTransactionId,
      status: 'cancelled',
      message: 'Stripe payment cancelled successfully',
      cancelNotificationSent: !!record.cancelUrl,
    });
  } catch (error) {
    console.error('Stripe cancel error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Cancellation failed' },
      { status: 500 }
    );
  }
}
