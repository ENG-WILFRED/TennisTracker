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

    // Only process checkout.session.completed events to avoid duplicate fulfillment.
    if (type !== 'checkout.session.completed') {
      return new Response(
        JSON.stringify({ received: true }),
        { status: 200 }
      );
    }

    let transactionId = stripeMetadata?.transactionId;
    let payment = null;

    if (transactionId) {
      payment = await prisma.paymentRecord.findUnique({ where: { id: transactionId } });
    }

    if (!payment && stripeMetadata?.eventId && stripeMetadata?.userId) {
      payment = await prisma.paymentRecord.findFirst({
        where: {
          provider: 'stripe',
          eventId: stripeMetadata.eventId,
          userId: stripeMetadata.userId,
          providerStatus: 'pending',
        },
        orderBy: { createdAt: 'desc' },
      });
      transactionId = payment?.id || transactionId;
    }

    if (!payment) {
      console.error('Payment record not found for Stripe webhook', { transactionId, metadata: stripeMetadata });
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
      console.log(`🎾 Processing tournament entry payment with eventId: ${payment.eventId}, userId: ${payment.userId}`);
      const member = await prisma.clubMember.findFirst({ where: { playerId: payment.userId } });
      if (member) {
        console.log(`✓ Found member: ${member.id} for userId: ${payment.userId}`);
        const existingRegistration = await prisma.eventRegistration.findFirst({
          where: {
            eventId: payment.eventId,
            memberId: member.id,
          },
        });

        if (existingRegistration) {
          console.log(`✓ Found existing registration: ${existingRegistration.id}, current status: ${existingRegistration.status}`);
          if (existingRegistration.status !== 'registered') {
            await prisma.eventRegistration.update({
              where: { id: existingRegistration.id },
              data: { status: 'registered' },
            });
            console.log(`✅ Updated registration to registered: ${existingRegistration.id}`);
          } else {
            console.log(`ℹ️ Registration already registered: ${existingRegistration.id}`);
          }
        } else {
          console.log(`→ Creating new registration for eventId: ${payment.eventId}, memberId: ${member.id}`);
          const latestRegistration = await prisma.eventRegistration.findFirst({
            where: { eventId: payment.eventId },
            orderBy: { signupOrder: 'desc' },
          });
          const signupOrder = (latestRegistration?.signupOrder || 0) + 1;
          const newRegistration = await prisma.eventRegistration.create({
            data: {
              eventId: payment.eventId,
              memberId: member.id,
              status: 'registered',
              signupOrder,
            },
          });
          console.log(`✅ Created new registration: ${newRegistration.id} with signupOrder: ${signupOrder}`);
        }
      } else {
        console.warn(`⚠️ No club member found for playerId: ${payment.userId}`);
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
