import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';
import { notify } from '@/app/api/notification';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ playerId: string; requestId: string }> }
) {
  const user = await verifyApiAuth(req);
  const { playerId, requestId } = await params;

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the user is the player
  if (user.id !== playerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { message, subject } = await req.json();

  if (!message || message.trim() === '') {
    return NextResponse.json(
      { error: 'Message is required' },
      { status: 400 }
    );
  }

  try {
    const request = await prisma.coachRequest.findUnique({
      where: { id: requestId },
      include: {
        coach: {
          select: {
            userId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        player: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json(
        { error: 'Coach request not found' },
        { status: 404 }
      );
    }

    if (request.playerId !== playerId) {
      return NextResponse.json(
        { error: 'This request does not belong to you' },
        { status: 403 }
      );
    }

    // Record the outreach in history
    const history = await prisma.coachRequestHistory.create({
      data: {
        coachRequestId: requestId,
        action: 'message_sent',
        actionBy: 'player',
        message: message,
        metadata: {
          subject: subject || 'Inquiry',
        },
      },
    });

    // Send email to coach
    try {
      await notify({
        to: request.coach.user.email,
        channel: 'email',
        template: 'player_reached_out_to_coach',
        data: {
          coachName: `${request.coach.user.firstName} ${request.coach.user.lastName}`.trim(),
          playerName: `${request.player.user.firstName} ${request.player.user.lastName}`.trim(),
          playerEmail: request.player.user.email,
          message: message,
          subject: subject || 'Player Inquiry',
        },
      });
    } catch (error) {
      console.error('Failed to notify coach:', error);
    }

    return NextResponse.json({
      message: 'Your message has been sent to the coach',
      history: {
        id: history.id,
        action: history.action,
        actionBy: history.actionBy,
        message: history.message,
        createdAt: history.createdAt,
      },
    });
  } catch (error) {
    console.error('Error sending reach-out message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
