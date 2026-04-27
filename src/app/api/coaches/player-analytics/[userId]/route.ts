import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'Player ID required' },
        { status: 400 }
      );
    }

    // Get player info
    const player = await prisma.player.findUnique({
      where: { userId },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Get matches where player participated
    const matchesParticipated = await prisma.match.findMany({
      where: {
        OR: [
          { playerAId: userId },
          { playerBId: userId },
        ],
      },
    });

    // Calculate win rate from matches
    let matchesWon = 0;
    let matchesLost = 0;

    matchesParticipated.forEach((game) => {
      if (game.playerAId === userId && game.winnerId === userId) {
        matchesWon++;
      } else if (game.playerBId === userId && game.winnerId === userId) {
        matchesWon++;
      } else if (game.winnerId && game.winnerId !== userId) {
        matchesLost++;
      }
    });

    const winRate =
      matchesParticipated.length > 0
        ? ((matchesWon / matchesParticipated.length) * 100).toFixed(2)
        : 0;

    // Calculate skill level based on matches played and win rate
    const matchesPlayed = matchesParticipated.length;
    const winRateNum = parseFloat(winRate as string);
    let skillLevel = 'Beginner';

    if (matchesPlayed >= 20) {
      if (winRateNum >= 60) {
        skillLevel = 'Advanced';
      } else if (winRateNum >= 40) {
        skillLevel = 'Intermediate';
      }
    } else if (matchesPlayed >= 10) {
      if (winRateNum >= 50) {
        skillLevel = 'Intermediate';
      }
    }

    // Use player's stored statistics
    const totalSessions = Math.round(player.matchesPlayed / 2) || 0; // Estimate based on matches
    const activitiesAttended = player.matchesPlayed || 0; // Use matches as activities
    const avgSessionDuration = '60min'; // Default estimate

    return NextResponse.json(
      {
        playerId: player.userId,
        userId: player.userId,
        playerName: `${player.user.firstName} ${player.user.lastName}`,
        totalSessions: totalSessions,
        activitiesAttended: activitiesAttended,
        gamesPlayed: matchesPlayed,
        gamesWon: matchesWon,
        gamesLost: matchesLost,
        winRate: parseFloat(winRate as string),
        skillLevel: skillLevel,
        avgSessionDuration: avgSessionDuration,
        matchesPlayedFromStats: player.matchesPlayed || 0,
        matchesWonFromStats: player.matchesWon || 0,
        lastUpdated: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching player analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
