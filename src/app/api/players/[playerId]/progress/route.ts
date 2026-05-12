import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/players/[playerId]/progress
 * 
 * Returns player progress with completed sessions, ratings, and improvements
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
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Get all completed sessions with ratings
    const completedSessions = await prisma.coachSession.findMany({
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
            overallRating: true,
            techniquRating: true,
            mentalRating: true,
            fitnessRating: true,
            teamworkRating: true,
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { endTime: 'desc' },
      take: 50,
    });

    // Get all ratings from coaches
    let allRatings = [];
    try {
      allRatings = await prisma.coachPlayerRating.findMany({
        where: {
          playerId,
          isConcluded: true,
        },
        select: {
          id: true,
          coachId: true,
          overallRating: true,
          techniquRating: true,
          mentalRating: true,
          fitnessRating: true,
          teamworkRating: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2021'
      ) {
        console.warn('Coach ratings table does not exist yet', error.message);
        allRatings = [];
      } else {
        throw error;
      }
    }

    // Calculate statistics
    const totalCompletedSessions = completedSessions.length;
    const totalRatedSessions = completedSessions.filter(
      (s) => s.sessionRatings.length > 0
    ).length;

    const stats = {
      totalCompletedSessions,
      totalRatedSessions,
      averageRating:
        allRatings.length > 0
          ? (
              allRatings.reduce((sum: number, r) => sum + r.overallRating, 0) /
              allRatings.length
            ).toFixed(2)
          : 0,
      averageTechniqueRating:
        allRatings.filter((r) => r.techniquRating).length > 0
          ? (
              allRatings
                .filter((r) => r.techniquRating)
                .reduce((sum: number, r) => sum + (r.techniquRating || 0), 0) /
              allRatings.filter((r) => r.techniquRating).length
            ).toFixed(2)
          : 0,
      averageMentalRating:
        allRatings.filter((r) => r.mentalRating).length > 0
          ? (
              allRatings
                .filter((r) => r.mentalRating)
                .reduce((sum: number, r) => sum + (r.mentalRating || 0), 0) /
              allRatings.filter((r) => r.mentalRating).length
            ).toFixed(2)
          : 0,
      averageFitnessRating:
        allRatings.filter((r) => r.fitnessRating).length > 0
          ? (
              allRatings
                .filter((r) => r.fitnessRating)
                .reduce((sum: number, r) => sum + (r.fitnessRating || 0), 0) /
              allRatings.filter((r) => r.fitnessRating).length
            ).toFixed(2)
          : 0,
      averageTeamworkRating:
        allRatings.filter((r) => r.teamworkRating).length > 0
          ? (
              allRatings
                .filter((r) => r.teamworkRating)
                .reduce((sum: number, r) => sum + (r.teamworkRating || 0), 0) /
              allRatings.filter((r) => r.teamworkRating).length
            ).toFixed(2)
          : 0,
    };

    // Format sessions
    const formattedSessions = completedSessions.map((s) => ({
      id: s.id,
      title: s.title,
      coachName: `${s.coach.user.firstName} ${s.coach.user.lastName}`,
      date: s.endTime.toISOString(),
      rating: s.sessionRatings[0]?.overallRating || null,
    }));

    // Trend analysis (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentSessions = completedSessions.filter(
      (s) => new Date(s.endTime) > threeMonthsAgo
    );

    const recentRatings = recentSessions
      .filter((s) => s.sessionRatings.length > 0)
      .map((s) => s.sessionRatings[0].overallRating);

    const trend =
      recentRatings.length > 0
        ? (recentRatings.reduce((a: number, b: number) => a + b, 0) / recentRatings.length).toFixed(
            2
          )
        : null;

    return NextResponse.json({
      player: {
        id: player.userId,
        name: `${player.user.firstName} ${player.user.lastName}`,
        matchesPlayed: player.matchesPlayed,
        matchesWon: player.matchesWon,
        matchesLost: player.matchesLost,
      },
      stats,
      sessions: formattedSessions,
      trend: {
        last3MonthsAverage: trend,
        totalRatingsInLast3Months: recentRatings.length,
        improvement:
          recentRatings.length >= 2
            ? (
                recentRatings[recentRatings.length - 1] -
                recentRatings[0]
              ).toFixed(2)
            : null,
      },
    });
  } catch (error) {
    console.error('Error fetching player progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player progress' },
      { status: 500 }
    );
  }
}
