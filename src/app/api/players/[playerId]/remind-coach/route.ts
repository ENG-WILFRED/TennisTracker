import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { notify } from '@/app/api/notification';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;
    const payload = await request.json();

    const player = await prisma.player.findUnique({
      where: { userId: playerId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const relationships = await prisma.coachPlayerRelationship.findMany({
      where: {
        playerId,
        status: 'active',
      },
      include: {
        coach: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!relationships.length) {
      return NextResponse.json({ error: 'No active coach relationships found' }, { status: 404 });
    }

    const notifications = await Promise.all(
      relationships.map(async (relationship) => {
        const coachUser = relationship.coach.user;
        if (!coachUser?.email) {
          return { success: false, reason: 'missing email' };
        }

        const result = await notify({
          id: `coach-review-reminder-${playerId}-${relationship.coach.userId}-${Date.now()}`,
          to: coachUser.email,
          channel: 'email',
          template: 'coach_review_reminder',
          data: {
            coachName: `${coachUser.firstName} ${coachUser.lastName}`,
            playerName: `${player.user.firstName} ${player.user.lastName}`,
            playerId,
            ...payload,
          },
        });

        return { success: !!result.success, email: coachUser.email };
      })
    );

    const sentCount = notifications.filter((n) => n.success).length;
    return NextResponse.json({
      success: true,
      message: sentCount > 0 ? `${sentCount} reminder(s) sent` : 'No reminders could be sent',
      details: notifications,
    });
  } catch (error) {
    console.error('Error sending coach reminder:', error);
    return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 });
  }
}
