import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';
import { NextResponse } from 'next/server';

/**
 * GET /api/player/payment-reminders?playerId=xxx
 * Get all payment reminders for a player
 */
export async function GET(request: Request) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json(
        { error: 'Missing required query param: playerId' },
        { status: 400 }
      );
    }

    // Get all payment reminders for the player (unresolved only)
    const reminders = await prisma.paymentReminder.findMany({
      where: {
        member: {
          playerId,
        },
        isResolved: false,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            entryFee: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      reminders,
      count: reminders.length,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Get payment reminders error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
}
