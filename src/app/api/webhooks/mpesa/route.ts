import prisma from '@/lib/prisma';
import { OrganizationActivityTracker } from '@/lib/organizationActivity';

/**
 * M-Pesa Callback Handler
 * Receives payment confirmation from M-Pesa gateway
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();

    const {
      transactionId,
      checkoutRequestId,
      resultCode,
      resultDesc,
      mpesaReceiptNumber,
      mpesaTransactionDate,
      mpesaAmount,
    } = payload;

    const payment = await prisma.paymentRecord.findUnique({
      where: { id: transactionId },
    });

    if (!payment) {
      return new Response(JSON.stringify({ error: 'Payment record not found' }), { status: 404 });
    }

    const paymentSuccess = resultCode === 0;

    await prisma.paymentRecord.update({
      where: { id: transactionId },
      data: {
        providerStatus: paymentSuccess ? 'completed' : 'failed',
        providerTransactionId: mpesaReceiptNumber || mpesaAmount?.toString() || null,
        metadata: JSON.stringify({
          ...(payment.metadata ? JSON.parse(payment.metadata) : {}),
          mpesaReceiptNumber,
          mpesaTransactionDate,
          mpesaAmount,
          resultCode,
          resultDesc,
          callbackReceivedAt: new Date().toISOString(),
        }),
      },
    });

    // Track payment activity for organization
    if (paymentSuccess && payment.eventId) {
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
              amount: mpesaAmount || payment.amount,
              currency: payment.currency,
              bookingType: payment.bookingType,
              eventName: event.name,
              paymentId: payment.id,
              mpesaReceiptNumber: mpesaReceiptNumber || null,
            },
            metadata: {
              eventId: payment.eventId,
              transactionId: mpesaReceiptNumber || null,
            },
          });
        }
      } catch (error) {
        console.error('Failed to track payment activity:', error);
      }
    }

    if (paymentSuccess && payment.bookingType === 'tournament_entry' && payment.eventId) {
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

    if (paymentSuccess && payment.bookingType === 'amenity_booking' && payment.eventId) {
      // Optionally mark amenity booking complete if applicable (depends on how dependent model is structured)
      // Not implemented due to no transactionId field on amenityBooking model in schema
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Payment ${paymentSuccess ? 'confirmed' : 'failed'}`,
        transactionId,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Callback processing failed',
      }),
      { status: 500 }
    );
  }
}
