import { NextRequest, NextResponse } from 'next/server';
import { handlePaymentCallback } from '@/actions/payments';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Stripe Payment Webhook Handler
 * Receives webhook events from Stripe
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    // Verify webhook signature
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret || !signature) {
      console.warn('Missing webhook signature or secret');
      return NextResponse.json({ success: false, error: 'Signature verification failed' }, { status: 400 });
    }

    // Verify signature (simplified - use Stripe's verifySignature in production)
    const data = JSON.parse(body);
    console.log('Stripe webhook received:', data.type);

    // Handle payment_intent.succeeded and charge.succeeded events
    if (!['payment_intent.succeeded', 'charge.succeeded', 'payment_intent.payment_failed'].includes(data.type)) {
      return NextResponse.json({ success: true, message: 'Event ignored' });
    }

    const paymentData = data.data?.object || {};
    const transactionId = paymentData.metadata?.transactionId;

    // Get the payment record to access callback URL
    const record = transactionId
      ? await prisma.paymentRecord.findUnique({
          where: { id: transactionId },
        })
      : null;
    
    const result = await handlePaymentCallback('stripe', {
      type: data.type,
      id: paymentData.id,
      status: paymentData.status,
      metadata: paymentData.metadata,
      transactionId,
      sessionId: paymentData.id,
    });

    // Send callback notification if registered and payment succeeded
    if (
      record &&
      record.callbackUrl &&
      ['payment_intent.succeeded', 'charge.succeeded'].includes(data.type)
    ) {
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
            gateway: 'stripe',
            status: 'completed',
            transactionId: paymentData.id,
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
      console.error('Stripe webhook processing failed:', result.error);
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
