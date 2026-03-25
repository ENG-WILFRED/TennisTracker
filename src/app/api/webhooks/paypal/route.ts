import prisma from '@/lib/prisma';
import { OrganizationActivityTracker } from '@/lib/organizationActivity';

/**
 * PayPal Payment Success Callback Handler
 * Called when user approves PayPal payment
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const transactionId = url.searchParams.get('transactionId');
    const token = url.searchParams.get('token');
    const payerId = url.searchParams.get('PayerID');

    if (!transactionId || !token) {
      return new Response(
        JSON.stringify({ error: 'Missing transaction ID or token' }),
        { status: 400 }
      );
    }

    // Find transaction
    const payment = await prisma.paymentRecord.findUnique({
      where: { id: transactionId },
    });

    if (!payment) {
      return new Response(JSON.stringify({ error: 'Payment record not found' }), { status: 404 });
    }

    const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};

    await prisma.paymentRecord.update({
      where: { id: transactionId },
      data: {
        providerStatus: 'completed',
        providerTransactionId: token || undefined,
        metadata: JSON.stringify({
          ...metadata,
          paypalToken: token,
          paypalPayerId: payerId,
          paypalApprovedAt: new Date().toISOString(),
        }),
      },
    });

    // Track payment activity for organization
    if (payment.eventId) {
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
              paypalToken: token,
            },
            metadata: {
              eventId: payment.eventId,
              transactionId: token,
            },
          });
        }
      } catch (error) {
        console.error('Failed to track payment activity:', error);
      }
    }

    if (payment.bookingType === 'tournament_entry' && payment.eventId) {
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

    // Redirect to success page
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/tournaments/${payment.eventId ?? ''}?payment=success&transactionId=${transactionId}`,
      },
    });
  } catch (error) {
    console.error('PayPal success callback error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Callback processing failed',
      }),
      { status: 500 }
    );
  }
}

/**
 * PayPal Payment Cancellation Handler
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const transactionId = url.searchParams.get('transactionId');

    if (!transactionId) {
      return new Response(
        JSON.stringify({ error: 'Missing transaction ID' }),
        { status: 400 }
      );
    }

    // Find and update transaction
    const transaction = await prisma.paymentRecord.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404 }
      );
    }

    const existingMetadata = transaction.metadata ? JSON.parse(transaction.metadata) : {};

    await prisma.paymentRecord.update({
      where: { id: transactionId },
      data: {
        providerStatus: 'failed',
        metadata: JSON.stringify({
          ...existingMetadata,
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
        }),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment cancelled',
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('PayPal cancel callback error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Cancellation handling failed',
      }),
      { status: 500 }
    );
  }
}
