import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';
import { notify } from '@/app/api/notification';

export async function PUT(
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

  const { action } = await req.json(); // 'accept' or 'decline'

  if (!action || !['accept', 'decline'].includes(action)) {
    return NextResponse.json(
      { error: 'Action must be "accept" or "decline"' },
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

    const newStatus = action === 'accept' ? 'accepted' : 'declined';

    // Update coach request status
    const updated = await prisma.coachRequest.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        respondedAt: new Date(),
      },
      include: {
        coach: true,
      },
    });

    // Record history
    await prisma.coachRequestHistory.create({
      data: {
        coachRequestId: requestId,
        action: action === 'accept' ? 'request_accepted' : 'request_declined',
        actionBy: 'player',
        message: `Player ${action}ed the coaching request`,
      },
    });

    // If accepted, create/update the CoachPlayerRelationship
    if (action === 'accept') {
      await prisma.coachPlayerRelationship.upsert({
        where: {
          coachId_playerId: {
            coachId: request.coachId,
            playerId: request.playerId,
          },
        },
        create: {
          coachId: request.coachId,
          playerId: request.playerId,
          status: 'active',
          joinedAt: new Date(),
        },
        update: {
          status: 'active',
          updatedAt: new Date(),
        },
      });

      // Notify coach of acceptance
      try {
        await notify({
          to: request.coach.user.email,
          channel: 'email',
          template: 'coach_request_accepted',
          data: {
            coachName: `${request.coach.user.firstName} ${request.coach.user.lastName}`.trim(),
            playerName: `${request.player.user.firstName} ${request.player.user.lastName}`.trim(),
          },
        });
      } catch (error) {
        console.error('Failed to notify coach:', error);
      }
    } else {
      // Notify coach of decline
      try {
        await notify({
          to: request.coach.user.email,
          channel: 'email',
          template: 'coach_request_declined',
          data: {
            coachName: `${request.coach.user.firstName} ${request.coach.user.lastName}`.trim(),
            playerName: `${request.player.user.firstName} ${request.player.user.lastName}`.trim(),
          },
        });
      } catch (error) {
        console.error('Failed to notify coach:', error);
      }
    }

    return NextResponse.json({
      message: `Coach request ${action}ed successfully`,
      request: updated,
      status: newStatus,
    });
  } catch (error) {
    console.error('Error updating coach request:', error);
    return NextResponse.json(
      { error: 'Failed to update coach request' },
      { status: 500 }
    );
  }
}
