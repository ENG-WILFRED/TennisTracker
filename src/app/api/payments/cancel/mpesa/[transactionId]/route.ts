import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Cancel M-Pesa Payment
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

    if (record.provider !== 'mpesa') {
      return NextResponse.json(
        { success: false, error: 'Invalid provider for this endpoint' },
        { status: 400 }
      );
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
            gateway: 'mpesa',
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
      status: 'cancelled',
      message: 'M-Pesa payment cancelled successfully',
      cancelNotificationSent: !!record.cancelUrl,
    });
  } catch (error) {
    console.error('M-Pesa cancel error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Cancellation failed' },
      { status: 500 }
    );
  }
}
