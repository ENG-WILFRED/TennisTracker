'use server';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { randomUUID } from 'crypto';

/**
 * POST /api/bookings/simulate-payment
 * 
 * Simulated payment endpoint for development/testing
 * Allows completing bookings without real payment providers
 * 
 * Request body:
 * {
 *   playerId: string,
 *   courtId: string,
 *   organizationId: string,
 *   startTime: string (ISO),
 *   endTime: string (ISO),
 *   amount: number,
 *   bookingId?: string (existing pending booking to confirm)
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
      playerId,
      courtId,
      organizationId,
      startTime,
      endTime,
      amount,
      bookingId, // Optional: existing pending booking to update
    } = body;

    // Validation
    if (!playerId || !courtId || !organizationId || !startTime || !endTime || amount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
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

    // Check if slot is available (exclude existing booking if updating)
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
        ...(bookingId ? { NOT: { id: bookingId } } : {}), // Exclude current booking if updating
      },
    });

    if (conflictingBooking) {
      return NextResponse.json(
        { success: false, error: 'This time slot is no longer available' },
        { status: 409 }
      );
    }

    // Determine if peak hours
    const start = new Date(startTime);
    const hour = start.getHours();
    const isPeak = hour >= 17 && hour < 21;

    let updatedBooking;

    if (bookingId) {
      // Update existing pending booking to confirmed
      updatedBooking = await prisma.courtBooking.update({
        where: { id: bookingId },
        data: {
          status: 'confirmed',
          memberId: clubMember.id,
          price: amount || 45,
          isPeak,
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
    } else {
      // Create new confirmed booking
      const playerData = await prisma.player.findUnique({
        where: { userId: playerId },
        include: { user: true },
      });

      const playerName = playerData?.user?.firstName 
        ? `${playerData.user.firstName} ${playerData.user.lastName || ''}`.trim()
        : playerData?.user?.email || 'Unknown';

      updatedBooking = await prisma.courtBooking.create({
        data: {
          courtId,
          organizationId,
          memberId: clubMember.id,
          playerName,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          bookingType: 'regular',
          status: 'confirmed',
          isPeak,
          price: amount || 45,
          notes: 'Simulated payment - development/testing',
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
    }

    // Create simulated payment record
    const transactionId = randomUUID();
    await prisma.paymentRecord.create({
      data: {
        id: transactionId,
        userId: playerId,
        bookingType: 'court_booking',
        amount,
        currency: 'KES',
        provider: 'simulated',
        providerStatus: 'completed',
        providerTransactionId: transactionId,
        metadata: JSON.stringify({
          simulatedPayment: true,
          bookingId: updatedBooking.id,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      bookingId: updatedBooking.id,
      message: '✅ Booking confirmed with simulated payment (development)',
    });
  } catch (error: any) {
    console.error('Simulated payment error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process simulated payment' },
      { status: 500 }
    );
  }
}
