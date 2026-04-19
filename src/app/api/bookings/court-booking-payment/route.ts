'use server';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/bookings/court-booking-payment
 * 
 * Webhook/Callback handler for payment confirmations
 * Creates court booking when payment is confirmed
 * Called after payment provider (PayPal, Stripe) confirms payment
 * 
 * Request body:
 * {
 *   transactionId: string (payment record ID),
 *   status: 'success' | 'failed',
 *   courtId: string,
 *   organizationId: string,
 *   playerId: string,
 *   startTime: string (ISO),
 *   endTime: string (ISO),
 *   matchType?: string,
 *   amount: number
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   bookingId?: string,
 *   message?: string,
 *   error?: string
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      transactionId,
      status,
      courtId,
      organizationId,
      playerId,
      startTime,
      endTime,
      matchType = 'singles',
      amount,
    } = body;

    // Validation
    if (!transactionId || !status || !courtId || !organizationId || !playerId || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get payment record
    const paymentRecord = await prisma.paymentRecord.findUnique({
      where: { id: transactionId },
    });

    if (!paymentRecord) {
      return NextResponse.json(
        { success: false, error: 'Payment record not found' },
        { status: 404 }
      );
    }

    // Update payment record status
    await prisma.paymentRecord.update({
      where: { id: transactionId },
      data: {
        providerStatus: status === 'success' ? 'completed' : 'failed',
      },
    });

    // If payment failed, return error
    if (status !== 'success') {
      return NextResponse.json(
        { success: false, error: 'Payment was not successful', message: 'Booking was not created' },
        { status: 400 }
      );
    }

    // Verify player is member of organization
    const clubMember = await prisma.clubMember.findFirst({
      where: {
        organizationId,
        playerId,
      },
    });

    if (!clubMember) {
      return NextResponse.json(
        { success: false, error: 'Player is not a member of this organization' },
        { status: 403 }
      );
    }

    // Check if slot is available
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
        { success: false, error: 'This time slot is no longer available - it was booked by another user during payment' },
        { status: 409 }
      );
    }

    // Determine if peak hours
    const start = new Date(startTime);
    const hour = start.getHours();
    const isPeak = hour >= 17 && hour < 21;

    // Create confirmed booking
    const booking = await prisma.courtBooking.create({
      data: {
        courtId,
        organizationId,
        memberId: clubMember.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        bookingType: 'regular',
        status: 'confirmed',
        isPeak,
        price: amount || 45, // Use passed amount or default
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

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      message: 'Booking confirmed with successful payment',
    });
  } catch (error: any) {
    console.error('Court booking payment callback error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process booking confirmation' },
      { status: 500 }
    );
  }
}
