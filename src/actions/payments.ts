'use server';

import prisma from '@/lib/prisma';

// Get base URL for callbacks and cancellations
const getBaseUrl = () => {
  // Use NEXT_PUBLIC_TEST_BASE_URL for development/testing
  if (process.env.NEXT_PUBLIC_TEST_BASE_URL) {
    return process.env.NEXT_PUBLIC_TEST_BASE_URL;
  }
  // Fallback to NEXT_PUBLIC_SITE_URL for production
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  // Default fallback
  return 'http://localhost:3020';
};

/**
 * M-Pesa STK Push Payment Action
 * Initiates an M-Pesa STK push that prompts user for PIN
 */
export async function processMPesaPayment(
  mobileNumber: string,
  amount: number,
  accountReference: string,
  transactionDesc: string,
  userId: string,
  eventId: string,
  bookingType: 'tournament_entry' | 'amenity_booking' | 'court_booking',
  metadata: Record<string, any> = {}
) {
  try {
    if (!mobileNumber || !amount || amount <= 0) {
      return { success: false, error: 'Invalid mobile number or amount' };
    }

    if (!mobileNumber.match(/^254\d{9}$/)) {
      return { success: false, error: 'Invalid mobile number format. Use 254XXXXXXXXX' };
    }

    const baseUrl = getBaseUrl();
    const callbackUrl = `${baseUrl}/api/payments/callback/mpesa`;
    const cancelUrl = `${baseUrl}/api/payments/cancel/mpesa`;

    const record = await prisma.paymentRecord.create({
      data: {
        userId,
        eventId,
        bookingType,
        amount,
        currency: 'KES',
        provider: 'mpesa',
        providerStatus: 'pending',
        callbackUrl,
        cancelUrl,
        metadata: JSON.stringify({ mobileNumber, accountReference, transactionDesc, ...metadata }),
      },
    });

    const mpesaResponse = await fetch('https://mpesa-integration-worker.kimaniwilfred95.workers.dev/api/stk/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        mobileNumber,
        amount: Math.round(amount),
        accountReference,
        transactionDesc,
        transactionId: record.id,
        callbackUrl,
        cancelUrl,
      }),
    });

    if (!mpesaResponse.ok) {
      const error = await mpesaResponse.json();
      await prisma.paymentRecord.update({
        where: { id: record.id },
        data: { providerStatus: 'failed' },
      });
      console.error('M-Pesa STK push failed:', error);
      return { success: false, error: error?.message || 'M-Pesa request failed' };
    }

    const mpesaData = await mpesaResponse.json();

    await prisma.paymentRecord.update({
      where: { id: record.id },
      data: {
        providerTransactionId: mpesaData.checkoutRequestId || mpesaData.requestId || null,
        checkoutUrl: null,
        providerStatus: 'pending',
      },
    });

    return {
      success: true,
      transactionId: record.id,
      checkoutRequestId: mpesaData.checkoutRequestId,
      message: 'M-Pesa STK push sent. Please complete the payment on your phone.',
      callbackUrlRegistered: true,
      cancelUrlRegistered: true,
    };
  } catch (error) {
    console.error('M-Pesa payment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed',
    };
  }
}

export async function processPayPalPayment(
  amount: number,
  currency: string,
  userId: string,
  eventId: string,
  bookingType: 'tournament_entry' | 'amenity_booking' | 'court_booking',
  metadata: Record<string, any> = {}
) {
  try {
    if (!amount || amount <= 0) {
      return { success: false, error: 'Invalid amount' };
    }

    const baseUrl = getBaseUrl();
    const callbackUrl = `${baseUrl}/api/payments/callback/paypal`;
    const cancelUrl = `${baseUrl}/api/payments/cancel/paypal`;

    const record = await prisma.paymentRecord.create({
      data: {
        userId,
        eventId,
        bookingType,
        amount,
        currency: currency.toUpperCase(),
        provider: 'paypal',
        providerStatus: 'pending',
        callbackUrl,
        cancelUrl,
        metadata: JSON.stringify(metadata),
      },
    });

    const idempotencyKey = `${record.id}-${Date.now()}`;
    const paypalResponse = await fetch('https://payment-gateway.kimaniwilfred95.workers.dev/api/payments/paypal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100) / 100,
        currency: currency.toUpperCase(),
        callbackUrl,
        cancelUrl,
        metadata: {
          transactionId: record.id,
          eventId,
          userId,
          bookingType,
          ...metadata,
        },
      }),
    });

    if (!paypalResponse.ok) {
      const error = await paypalResponse.json();
      await prisma.paymentRecord.update({
        where: { id: record.id },
        data: { providerStatus: 'failed' },
      });
      return { success: false, error: error?.message || 'PayPal request failed' };
    }

    const paypalData = await paypalResponse.json();

    const approveUrl = paypalData.approveUrl || 
      (paypalData.links?.find((link: any) => link.rel === 'approve')?.href) || null;

    await prisma.paymentRecord.update({
      where: { id: record.id },
      data: {
        providerTransactionId: paypalData.orderId || null,
        checkoutUrl: approveUrl,
      },
    });

    return {
      success: true,
      transactionId: record.id,
      orderId: paypalData.orderId,
      checkoutUrl: approveUrl,
      links: paypalData.links,
      callbackUrlRegistered: true,
      cancelUrlRegistered: true,
    };
  } catch (error) {
    console.error('PayPal payment error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Payment processing failed' };
  }
}

export async function processStripePayment(
  amount: number,
  currency: string,
  userId: string,
  eventId: string,
  bookingType: 'tournament_entry' | 'amenity_booking' | 'court_booking',
  metadata: Record<string, any> = {}
) {
  try {
    if (!amount || amount <= 0) {
      return { success: false, error: 'Invalid amount' };
    }

    const baseUrl = getBaseUrl();
    const callbackUrl = `${baseUrl}/api/payments/callback/stripe`;
    const cancelUrl = `${baseUrl}/api/payments/cancel/stripe`;

    const record = await prisma.paymentRecord.create({
      data: {
        userId,
        eventId,
        bookingType,
        amount,
        currency: currency.toLowerCase(),
        provider: 'stripe',
        providerStatus: 'pending',
        callbackUrl,
        cancelUrl,
        metadata: JSON.stringify(metadata),
      },
    });

    const idempotencyKey = `${record.id}-${Date.now()}`;
    const stripeResponse = await fetch('https://payment-gateway.kimaniwilfred95.workers.dev/api/payments/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        callbackUrl,
        cancelUrl,
        metadata: {
          transactionId: record.id,
          eventId,
          userId,
          bookingType,
          ...metadata,
        },
      }),
    });

    if (!stripeResponse.ok) {
      const error = await stripeResponse.json();
      await prisma.paymentRecord.update({
        where: { id: record.id },
        data: { providerStatus: 'failed' },
      });
      return { success: false, error: error?.message || 'Stripe request failed' };
    }

    const stripeData = await stripeResponse.json();

    const checkoutUrl = stripeData.checkoutUrl || stripeData.url || null;

    await prisma.paymentRecord.update({
      where: { id: record.id },
      data: {
        providerTransactionId: stripeData.paymentIntentId || stripeData.sessionId || null,
        checkoutUrl: checkoutUrl,
      },
    });

    return {
      success: true,
      transactionId: record.id,
      sessionId: stripeData.sessionId,
      checkoutUrl: checkoutUrl,
      clientSecret: stripeData.clientSecret,
      callbackUrlRegistered: true,
      cancelUrlRegistered: true,
    };
  } catch (error) {
    console.error('Stripe payment error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Payment processing failed' };
  }
}

export async function verifyPaymentStatus(transactionId: string) {
  try {
    const record = await prisma.paymentRecord.findUnique({
      where: { id: transactionId },
    });

    if (!record) {
      return { success: false, error: 'Transaction not found' };
    }

    return {
      success: true,
      transactionId,
      status: record.providerStatus,
      provider: record.provider,
      amount: record.amount,
      currency: record.currency,
      updatedAt: record.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error('Verify payment error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Verification failed' };
  }
}

export async function completePayment(
  transactionId: string,
  providerTransactionId: string,
  status: 'success' | 'failed'
) {
  try {
    const record = await prisma.paymentRecord.findUnique({
      where: { id: transactionId },
    });

    if (!record) {
      return { success: false, error: 'Transaction not found' };
    }

    await prisma.paymentRecord.update({
      where: { id: transactionId },
      data: {
        providerStatus: status === 'success' ? 'completed' : 'failed',
        providerTransactionId,
      },
    });

    if (status === 'success') {
      // Handle different booking types
      if (record.bookingType === 'tournament_entry' && record.eventId) {
        const member = await prisma.clubMember.findFirst({ where: { playerId: record.userId } });
        if (member) {
          const latestRegistration = await prisma.eventRegistration.findFirst({
            where: { eventId: record.eventId },
            orderBy: { signupOrder: 'desc' },
          });
          const signupOrder = (latestRegistration?.signupOrder || 0) + 1;
          await prisma.eventRegistration.create({
            data: {
              eventId: record.eventId,
              memberId: member.id,
              status: 'registered',
              signupOrder,
            },
          });
        }
      } else if (record.bookingType === 'court_booking' && record.eventId) {
        // Create court booking after successful payment
        await createCourtBooking(record.userId, record.eventId, record);
      }
    }

    return { success: true, transactionId, status };
  } catch (error) {
    console.error('Complete payment error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Payment completion failed' };
  }
}

export async function createCourtBooking(
  userId: string,
  courtId: string,
  paymentRecord: any
) {
  try {
    const metadata = typeof paymentRecord.metadata === 'string' 
      ? JSON.parse(paymentRecord.metadata) 
      : paymentRecord.metadata || {};

    // Extract booking details from metadata
    const { startTime, endTime, organizationId, matchType } = metadata;

    if (!startTime || !endTime || !organizationId) {
      return { success: false, error: 'Missing booking details' };
    }

    // Create the booking record
    const booking = await prisma.courtBooking.create({
      data: {
        memberId: userId,
        courtId,
        organizationId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        bookingType: 'regular',
        status: 'confirmed',
        notes: metadata.notes || '',
      },
    });

    return { success: true, bookingId: booking.id };
  } catch (error) {
    console.error('Create court booking error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Booking creation failed' };
  }
}

export async function getPaymentStatus(transactionId: string) {
  try {
    const record = await prisma.paymentRecord.findUnique({
      where: { id: transactionId },
      select: {
        id: true,
        providerStatus: true,
        provider: true,
        amount: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
        bookingType: true,
      },
    });

    if (!record) {
      return { success: false, error: 'Transaction not found' };
    }

    return {
      success: true,
      payment: record,
      isCompleted: record.providerStatus === 'completed',
    };
  } catch (error) {
    console.error('Get payment status error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get payment status' };
  }
}

export async function handlePaymentCallback(
  provider: 'mpesa' | 'paypal' | 'stripe',
  data: Record<string, any>
) {
  try {
    let transactionId = '';
    let status: 'success' | 'failed' = 'failed';

    if (provider === 'mpesa') {
      transactionId = data.transactionId;
      status = data.resultCode === '0' ? 'success' : 'failed';
    } else if (provider === 'paypal') {
      transactionId = data.custom || data.transactionId;
      status = ['COMPLETED', 'APPROVED'].includes(data.status) ? 'success' : 'failed';
    } else if (provider === 'stripe') {
      transactionId = data.metadata?.transactionId;
      status = ['payment_intent.succeeded', 'charge.succeeded'].includes(data.type) ? 'success' : 'failed';
    }

    if (!transactionId) {
      console.warn(`Missing transactionId in ${provider} callback`, data);
      return { success: false, error: 'Missing transaction ID' };
    }

    const providerTransactionId = data.id || data.transactionId || data.orderId || data.sessionId || '';
    return await completePayment(transactionId, providerTransactionId, status);
  } catch (error) {
    console.error('Payment callback error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Callback processing failed' };
  }
}
