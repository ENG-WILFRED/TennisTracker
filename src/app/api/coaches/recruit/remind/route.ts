import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';
import { notify } from '@/app/api/notification';

export async function POST(req: NextRequest) {
  const user = await verifyApiAuth(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  const coachId = body?.coachId;
  const playerId = body?.playerId;

  if (!coachId || !playerId) {
    return NextResponse.json({ error: 'coachId and playerId are required' }, { status: 400 });
  }

  if (user.id !== coachId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const relationship = await prisma.coachPlayerRelationship.findFirst({
    where: {
      coachId,
      playerId,
      status: 'pending',
    },
    include: {
      player: {
        select: {
          userId: true,
          user: { select: { email: true, firstName: true, lastName: true } },
        },
      },
      coach: {
        select: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    },
  });

  if (!relationship) {
    return NextResponse.json({ error: 'Pending coach relationship not found' }, { status: 404 });
  }

  const playerEmail = relationship.player.user?.email;

  if (!playerEmail) {
    return NextResponse.json({ error: 'Player email not available' }, { status: 500 });
  }

  try {
    await notify({
      to: playerEmail,
      channel: 'email',
      template: 'coach_recruit_reminder',
      data: {
        coachName: `${relationship.coach.user?.firstName || ''} ${relationship.coach.user?.lastName || ''}`.trim(),
        playerName: `${relationship.player.user?.firstName || ''} ${relationship.player.user?.lastName || ''}`.trim(),
        relationshipId: relationship.id,
      },
    });
  } catch (error) {
    console.error('Failed to send coach recruit reminder', error);
  }

  return NextResponse.json({ message: 'Reminder sent to player' });
}
