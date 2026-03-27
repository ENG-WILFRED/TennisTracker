import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, registrationId, memberId, message, reminderType = 'payment' } = body;

    if (!eventId || !registrationId || !memberId) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId, registrationId, memberId' },
        { status: 400 }
      );
    }

    // Verify the tournament exists and the organizer has access
    const tournament = await prisma.clubEvent.findUnique({
      where: { id: eventId },
      include: { organization: true },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Verify the registration exists
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: {
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

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    // Create payment reminder record
    const reminder = await prisma.paymentReminder.create({
      data: {
        eventId,
        registrationId,
        memberId,
        reminderType,
        message: message || `Payment reminder for ${tournament.name}`,
        sentAt: new Date(),
      },
      include: {
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
      reminder,
      message: `Payment reminder sent to ${registration.member.player.user.firstName} ${registration.member.player.user.lastName}`,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Payment reminder error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to send payment reminder',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tournaments/payment-reminder?eventId=xxx&memberId=xxx
 * Get payment reminders for a member in a tournament
 */
export async function GET(request: Request) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const memberId = searchParams.get('memberId');

    if (!eventId || !memberId) {
      return NextResponse.json(
        { error: 'Missing required query params: eventId, memberId' },
        { status: 400 }
      );
    }

    const reminders = await prisma.paymentReminder.findMany({
      where: {
        eventId,
        memberId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
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
