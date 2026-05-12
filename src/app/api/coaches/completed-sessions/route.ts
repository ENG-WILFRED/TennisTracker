import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/coaches/completed-sessions
 * 
 * Returns all completed sessions for a coach, including player ratings status
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const coachId = searchParams.get('coachId');
    const organizationId = searchParams.get('organizationId');

    if (!coachId) {
      return NextResponse.json(
        { error: 'Coach ID is required' },
        { status: 400 }
      );
    }

    // Build filter
    const where: any = {
      coachId,
      status: {
        in: ['completed', 'no-show'],
      },
    };

    if (organizationId) {
      where.organizationId = organizationId;
    }

    // Get completed sessions with rating status
    const sessions = await prisma.coachSession.findMany({
      where,
      include: {
        player: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        sessionRatings: {
          select: { id: true },
          take: 1,
        },
      },
      orderBy: {
        endTime: 'desc',
      },
      take: 50,
    });

    const formattedSessions = sessions.map((session) => ({
      id: session.id,
      title: session.title,
      playerId: session.playerId || '',
      playerName: session.player
        ? `${session.player.user.firstName} ${session.player.user.lastName}`
        : 'Unknown',
      endTime: session.endTime.toISOString(),
      durationMinutes: session.durationMinutes,
      status: session.status,
      hasRating: session.sessionRatings.length > 0,
    }));

    return NextResponse.json({ sessions: formattedSessions });
  } catch (error) {
    console.error('Error fetching completed sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch completed sessions' },
      { status: 500 }
    );
  }
}
