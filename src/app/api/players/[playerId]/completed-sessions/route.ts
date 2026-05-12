import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/players/[playerId]/completed-sessions
 * 
 * Returns all completed sessions for a player, including coach ratings
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;

  try {
    if (!playerId) {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      );
    }

    // Get completed sessions with coach ratings
    const sessions = await prisma.coachSession.findMany({
      where: {
        playerId,
        status: {
          in: ['completed', 'no-show'],
        },
      },
      include: {
        coach: {
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
          select: {
            id: true,
            overallRating: true,
            techniquRating: true,
            mentalRating: true,
            fitnessRating: true,
            teamworkRating: true,
            strengths: true,
            areasForImprovement: true,
            notes: true,
            createdAt: true,
          },
          take: 1, // Get the most recent rating
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        endTime: 'desc',
      },
    });

    const formattedSessions = sessions.map((session) => ({
      id: session.id,
      title: session.title,
      sessionType: session.sessionType,
      startTime: session.startTime.toISOString(),
      endTime: session.endTime.toISOString(),
      durationMinutes: session.durationMinutes,
      coachName: `${session.coach.user.firstName} ${session.coach.user.lastName}`,
      status: session.status,
      rating: session.sessionRatings[0]
        ? {
            id: session.sessionRatings[0].id,
            overallRating: session.sessionRatings[0].overallRating,
            techniquRating: session.sessionRatings[0].techniquRating,
            mentalRating: session.sessionRatings[0].mentalRating,
            fitnessRating: session.sessionRatings[0].fitnessRating,
            teamworkRating: session.sessionRatings[0].teamworkRating,
            strengths: session.sessionRatings[0].strengths,
            areasForImprovement: session.sessionRatings[0].areasForImprovement,
            notes: session.sessionRatings[0].notes,
            createdAt: session.sessionRatings[0].createdAt.toISOString(),
          }
        : null,
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
