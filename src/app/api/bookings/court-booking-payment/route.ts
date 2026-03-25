'use server';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/bookings/court-booking-payment
 * 
 * Handles payment processing for court bookings
 * Supports MPesa, PayPal, and Stripe
 * 
 * Request body:
 * {
 *   playerId: string,
 *   courtId: string,
 *   startTime: string (ISO),
 *   endTime: string (ISO),
 *   organizationId: string,
 *   amount: number,
 *   paymentMethod: 'mpesa' | 'paypal' | 'stripe',
 *   mobileNumber?: string (for M-Pesa),
 *   email?: string (for PayPal/Stripe)
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   bookingId?: string,
 *   paymentRecordId?: string,
 *   transactionId?: string,
 *   checkoutUrl?: string,
 *   message?: string,
 *   error?: string
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      playerId,
      courtId,
      startTime,
      endTime,
      organizationId,
      amount,
      paymentMethod,
      mobileNumber,
      email,
    } = body;

    // Validation
    if (!playerId || !courtId || !startTime || !endTime || !organizationId || !amount || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify player is member of organization
    const clubMember = await prisma.clubMember.findUnique({
      where: {
        organizationId_playerId: {
          organizationId,
          playerId,
        },
      },
    });

    if (!clubMember) {
      return NextResponse.json(
        { success: false, error: 'Player is not a member of this organization' },
        { status: 403 }
      );
    }

    //  Check if slot is available
    const conflictingBooking = await prisma.courtBooking.findFirst({
      where: {
        courtId,
        organizationId,
        startTime: {
          lt: new Date(endTime),
        },
        endTime: {
          gt: new Date(startTime),
        },
        status: { in: ['confirmed', 'no-show'] },
      },
    });

    if (conflictingBooking) {
      return NextResponse.json(
        { success: false, error: 'This time slot is already booked' },
        { status: 409 }
      );
    }

    // Determine if peak hours
    const start = new Date(startTime);
    const hour = start.getHours();
    const isPeak = hour >= 17 && hour < 21;

    // 1. Create booking in PENDING status
    const booking = await prisma.courtBooking.create({
      data: {
        courtId,
        organizationId,
        memberId: clubMember.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        bookingType: 'regular',
        status: 'pending', // Will move to 'confirmed' after payment success
        isPeak,
        price: amount,
      },
      include: {
        court: true,
        member: {
          include: {
            player: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    // 2. Create payment record
    const paymentRecord = await prisma.paymentRecord.create({
      data: {
        userId: playerId,
        eventId: booking.id,
        bookingType: 'court_booking',
        amount,
        currency: 'KES',
        provider: paymentMethod,
        providerStatus: 'pending',
        metadata: JSON.stringify({
          courtId,
          organizationId,
          bookingId: booking.id,
          mobileNumber: paymentMethod === 'mpesa' ? mobileNumber : null,
          email: paymentMethod !== 'mpesa' ? email : null,
        }),
      },
    });

    // 3. Process payment based on method
    let paymentResult: any = {};

    if (paymentMethod === 'mpesa') {
      if (!mobileNumber || !mobileNumber.match(/^254\d{9}$/)) {
        throw new Error('Invalid M-Pesa mobile number. Format: 254XXXXXXXXX');
      }

      paymentResult = await processMPesaPayment(mobileNumber, amount, playerId, paymentRecord.id);
    } else if (paymentMethod === 'paypal') {
      if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new Error('Invalid email address for PayPal');
      }

      paymentResult = await processPayPalPayment(amount, playerId, paymentRecord.id);
    } else if (paymentMethod === 'stripe') {
      paymentResult = await processStripePayment(amount, playerId, paymentRecord.id);
    } else {
      throw new Error('Unsupported payment method');
    }

    if (!paymentResult.success) {
      // Update payment record and booking on failure
      await prisma.paymentRecord.update({
        where: { id: paymentRecord.id },
        data: { providerStatus: 'failed' },
      });

      await prisma.courtBooking.update({
        where: { id: booking.id },
        data: { status: 'cancelled' },
      });

      return NextResponse.json(
        { success: false, error: paymentResult.error || 'Payment processing failed' },
        { status: 400 }
      );
    }

    // For M-Pesa STK push, booking stays pending until payment is confirmed via polling
    // For PayPal/Stripe, redirect URL is returned
    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      paymentRecordId: paymentRecord.id,
      transactionId: paymentResult.transactionId || paymentResult.checkoutRequestId,
      checkoutUrl: paymentResult.checkoutUrl || null,
      message: paymentResult.message || 'Payment initiated',
    });
  } catch (error: any) {
    console.error('Court booking payment error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Payment processing failed' },
      { status: 500 }
    );
  }
}

/**
 * M-Pesa STK Push Payment
 */
async function processMPesaPayment(
  mobileNumber: string,
  amount: number,
  userId: string,
  paymentRecordId: string
) {
  try {
    const response = await fetch('https://mpesa-integration-worker.kimaniwilfred95.workers.dev/api/stk/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        mobileNumber,
        amount: Math.round(amount),
        accountReference: `BOOKING-${paymentRecordId.slice(0, 8)}`,
        transactionDesc: 'Court Booking Payment',
        transactionId: paymentRecordId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.message || 'M-Pesa request failed');
    }

    const data = await response.json();

    // Update payment record with M-Pesa transaction details
    await prisma.paymentRecord.update({
      where: { id: paymentRecordId },
      data: {
        providerTransactionId: data.checkoutRequestId || data.requestId,
        providerStatus: 'pending',
      },
    });

    return {
      success: true,
      transactionId: paymentRecordId,
      checkoutRequestId: data.checkoutRequestId,
      message: 'M-Pesa STK push sent. Please complete payment on your phone.',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * PayPal Payment
 */
async function processPayPalPayment(
  amount: number,
  userId: string,
  paymentRecordId: string
) {
  try {
    const response = await fetch('https://payment-gateway.kimaniwilfred95.workers.dev/api/payments/paypal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'KES',
        description: 'Court Booking Payment',
        transactionId: paymentRecordId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.message || 'PayPal request failed');
    }

    const data = await response.json();

    // Update payment record with PayPal checkout URL
    await prisma.paymentRecord.update({
      where: { id: paymentRecordId },
      data: {
        checkoutUrl: data.approvalUrl || data.checkoutUrl,
        providerTransactionId: data.id || data.orderId,
        providerStatus: 'pending',
      },
    });

    return {
      success: true,
      transactionId: paymentRecordId,
      checkoutUrl: data.approvalUrl || data.checkoutUrl,
      message: 'Redirecting to PayPal...',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Stripe Payment
 */
async function processStripePayment(
  amount: number,
  userId: string,
  paymentRecordId: string
) {
  try {
    const response = await fetch('https://payment-gateway.kimaniwilfred95.workers.dev/api/payments/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Stripe uses cents
        currency: 'KES',
        description: 'Court Booking Payment',
        transactionId: paymentRecordId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.message || 'Stripe request failed');
    }

    const data = await response.json();

    // Update payment record with Stripe session
    await prisma.paymentRecord.update({
      where: { id: paymentRecordId },
      data: {
        checkoutUrl: data.url,
        providerTransactionId: data.sessionId,
        providerStatus: 'pending',
      },
    });

    return {
      success: true,
      transactionId: paymentRecordId,
      checkoutUrl: data.url,
      message: 'Redirecting to Stripe...',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
