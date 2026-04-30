import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = await params;
    const userId = auth.userId;

    // Check if user is assigned as referee for tasks related to this match
    const match = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      include: {
        event: true,
      },
    });

    if (!match) {
      return NextResponse.json({ canOfficiate: false });
    }

    // Check if user has referee tasks for this event
    const refereeTasks = await prisma.task.findMany({
      where: {
        assignedToId: userId,
        context: {
          path: ['eventId'],
          equals: match.eventId,
        },
        template: {
          role: 'REFEREE',
        },
      },
    });

    const canOfficiate = refereeTasks.length > 0;

    return NextResponse.json({ canOfficiate });
  } catch (err) {
    console.error('API /api/referee/matches/[matchId]/permission error:', err);
    return NextResponse.json({ canOfficiate: false }, { status: 500 });
  }
}