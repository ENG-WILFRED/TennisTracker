import prisma from '@/lib/prisma';
import { OrganizationActivityTracker } from '@/lib/organizationActivity';

/**
 * Stripe Webhook Handler
 * Receives payment events from Stripe
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();

    const {
      type,
      data: {
        object: {
          id: sessionId,
          payment_intent: paymentIntentId,
          payment_status: paymentStatus,
          metadata: stripeMetadata,
        },
      },
    } = payload;

    // Only process checkout.session.completed events
    if (type !== 'checkout.session.completed' && type !== 'payment_intent.succeeded') {
      return new Response(
        JSON.stringify({ received: true }),
        { status: 200 }
      );
    }

    const transactionId = stripeMetadata?.transactionId;

    if (!transactionId) {
      console.error('No transaction ID in Stripe metadata');
      return new Response(JSON.stringify({ error: 'Missing transaction ID in metadata' }), { status: 400 });
    }

    const payment = await prisma.paymentRecord.findUnique({ where: { id: transactionId } });

    if (!payment) {
      return new Response(JSON.stringify({ error: 'Payment record not found' }), { status: 404 });
    }

    const existingMetadata = payment.metadata ? JSON.parse(payment.metadata) : {};
    const paymentSuccessful = paymentStatus === 'paid' || type === 'payment_intent.succeeded';

    await prisma.paymentRecord.update({
      where: { id: transactionId },
      data: {
        providerStatus: paymentSuccessful ? 'completed' : 'failed',
        providerTransactionId: paymentIntentId || sessionId,
        metadata: JSON.stringify({
          ...existingMetadata,
          stripeSessionId: sessionId,
          stripePaymentIntentId: paymentIntentId,
          stripePaymentStatus: paymentStatus,
          webhookReceivedAt: new Date().toISOString(),
        }),
      },
    });

    // Track payment activity for organization
    if (paymentSuccessful && payment.eventId) {
      try {
        const event = await prisma.clubEvent.findUnique({
          where: { id: payment.eventId },
          select: { organizationId: true, name: true },
        });

        if (event) {
          await OrganizationActivityTracker.trackActivity({
            organizationId: event.organizationId,
            playerId: payment.userId,
            action: 'payment_made',
            details: {
              amount: payment.amount,
              currency: payment.currency,
              bookingType: payment.bookingType,
              eventName: event.name,
              paymentId: payment.id,
              stripePaymentIntentId: paymentIntentId,
            },
            metadata: {
              eventId: payment.eventId,
              transactionId: paymentIntentId || sessionId,
            },
          });
        }
      } catch (error) {
        console.error('Failed to track payment activity:', error);
      }
    }

    if (paymentSuccessful && payment.bookingType === 'tournament_entry' && payment.eventId) {
      const member = await prisma.clubMember.findFirst({ where: { playerId: payment.userId } });
      if (member) {
        const latestRegistration = await prisma.eventRegistration.findFirst({
          where: { eventId: payment.eventId },
          orderBy: { signupOrder: 'desc' },
        });
        const signupOrder = (latestRegistration?.signupOrder || 0) + 1;
        await prisma.eventRegistration.create({
          data: {
            eventId: payment.eventId,
            memberId: member.id,
            status: 'registered',
            signupOrder,
          },
        });
      }
    }


    return new Response(
      JSON.stringify({
        success: true,
        message: `Payment ${paymentSuccessful ? 'confirmed' : 'failed'}`,
        transactionId,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Stripe webhook error:', error);
    
    // Always return 200 to Stripe to acknowledge receipt
    return new Response(
      JSON.stringify({
        received: true,
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      }),
      { status: 200 }
    );
  }
}
