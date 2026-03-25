'use server';

import prisma from '@/lib/prisma';

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
  bookingType: 'tournament_entry' | 'amenity_booking' | 'court_booking'
) {
  try {
    if (!mobileNumber || !amount || amount <= 0) {
      return { success: false, error: 'Invalid mobile number or amount' };
    }

    if (!mobileNumber.match(/^254\d{9}$/)) {
      return { success: false, error: 'Invalid mobile number format. Use 254XXXXXXXXX' };
    }

    const record = await prisma.paymentRecord.create({
      data: {
        userId,
        eventId,
        bookingType,
        amount,
        currency: 'KES',
        provider: 'mpesa',
        providerStatus: 'pending',
        metadata: JSON.stringify({ mobileNumber, accountReference, transactionDesc }),
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

    const record = await prisma.paymentRecord.create({
      data: {
        userId,
        eventId,
        bookingType,
        amount,
        currency: currency.toUpperCase(),
        provider: 'paypal',
        providerStatus: 'pending',
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

    await prisma.paymentRecord.update({
      where: { id: record.id },
      data: {
        providerTransactionId: paypalData.orderId || null,
        checkoutUrl: paypalData.approveUrl || null,
      },
    });

    return {
      success: true,
      transactionId: record.id,
      links: paypalData.links,
      orderId: paypalData.orderId,
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

    const record = await prisma.paymentRecord.create({
      data: {
        userId,
        eventId,
        bookingType,
        amount,
        currency: currency.toLowerCase(),
        provider: 'stripe',
        providerStatus: 'pending',
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

    await prisma.paymentRecord.update({
      where: { id: record.id },
      data: {
        providerTransactionId: stripeData.paymentIntentId || stripeData.sessionId || null,
        checkoutUrl: stripeData.checkoutUrl || null,
      },
    });

    return {
      success: true,
      transactionId: record.id,
      sessionId: stripeData.sessionId,
      checkoutUrl: stripeData.checkoutUrl,
      clientSecret: stripeData.clientSecret,
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

    if (status === 'success' && record.bookingType === 'tournament_entry' && record.eventId) {
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
    }

    return { success: true, transactionId, status };
  } catch (error) {
    console.error('Complete payment error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Payment completion failed' };
  }
}
