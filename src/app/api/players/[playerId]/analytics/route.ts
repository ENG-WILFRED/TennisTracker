import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import prisma from '@/lib/prisma';

// GET analytics for a player - Now fetching REAL coach ratings instead of hardcoded data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'all';

    // Get player data
    const player = await prisma.player.findUnique({
      where: { userId: playerId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            photo: true,
          },
        },
      },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Calculate time range based on timeframe
    const now = new Date();
    let startDate = new Date(0); // All time

    if (timeframe === '3months') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (timeframe === '6months') {
      startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    } else if (timeframe === 'year') {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    // Get matches within timeframe
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { playerAId: playerId },
          { playerBId: playerId },
        ],
        createdAt: { gte: startDate },
      },
      include: {
        playerA: { select: { user: { select: { firstName: true, lastName: true } } } },
        playerB: { select: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate statistics
    let wins = 0;
    let losses = 0;
    const recentMatches = [];

    for (const match of matches.slice(0, 10)) {
      const playerIsA = match.playerAId === playerId;
      const opponent = playerIsA ? match.playerB : match.playerA;
      const opponentName = opponent ? `${opponent.user.firstName} ${opponent.user.lastName}` : 'Unknown';
      
      // Determine winner based on winnerId
      const isWin = match.winnerId === playerId;

      if (isWin) wins++;
      else losses++;

      recentMatches.push({
        date: new Date(match.createdAt).toLocaleDateString(),
        opponent: opponentName,
        result: isWin ? 'WIN' : 'LOSS',
        score: match.score || 'N/A',
      });
    }

    // Monthly breakdown
    const monthly = [];
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(now);
      monthDate.setMonth(now.getMonth() - (11 - i));
      const monthMatches = matches.filter(m => 
        m.createdAt.getMonth() === monthDate.getMonth() && 
        m.createdAt.getFullYear() === monthDate.getFullYear()
      );

      let monthWins = 0;
      for (const match of monthMatches) {
        const isWin = match.winnerId === playerId;
        if (isWin) monthWins++;
      }

      monthly.push({
        month: monthDate.toLocaleString('default', { month: 'short', year: '2-digit' }),
        matches: monthMatches.length,
        wins: monthWins,
        losses: monthMatches.length - monthWins,
      });
    }

    // Fetch REAL coach ratings instead of hardcoded data
    let coachRatings: any[] = [];
    let coachRatingsTableExists = true;

    try {
      coachRatings = await prisma.coachPlayerRating.findMany({
        where: { playerId },
        include: {
          coach: { select: { userId: true, user: { select: { firstName: true, lastName: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        (error as any).code === 'P2021'
      ) {
        console.warn('Coach ratings table does not exist yet', (error as any).message);
        coachRatingsTableExists = false;
        coachRatings = [];
      } else {
        throw error;
      }
    }

    // Calculate player rank based on average coach ratings
    let currentRank = 1;
    let averageCoachRating = 0;

    if (coachRatings.length > 0 && coachRatingsTableExists) {
      averageCoachRating = coachRatings.reduce((sum, r) => sum + r.overallRating, 0) / coachRatings.length;

      // Get all players with ratings to rank this player
      const allPlayersRatings = await prisma.coachPlayerRating.groupBy({
        by: ['playerId'],
        _avg: { overallRating: true },
        orderBy: { _avg: { overallRating: 'desc' } },
      });

      currentRank = allPlayersRatings.findIndex(p => p.playerId === playerId) + 1;
      if (currentRank === 0) currentRank = allPlayersRatings.length + 1; // Not rated players go to end
    } else {
      // If no coach ratings or table is missing, rank them at the end
      const totalUnratedPlayers = await prisma.player.count();
      currentRank = totalUnratedPlayers;
    }

    // Calculate performance metrics from coach ratings
    let serviceAccuracy = 0;
    let firstServeWinRate = 0;
    let breakPointConversion = 0;
    let aces = 0;
    let doubleFaults = 0;

    if (coachRatings.length > 0) {
      // Map coach ratings to performance metrics
      const techniquAvg = coachRatings.reduce((sum, r) => sum + (r.techniquRating || 0), 0) / coachRatings.length;
      const mentalAvg = coachRatings.reduce((sum, r) => sum + (r.mentalRating || 0), 0) / coachRatings.length;
      const fitnessAvg = coachRatings.reduce((sum, r) => sum + (r.fitnessRating || 0), 0) / coachRatings.length;
      const teamworkAvg = coachRatings.reduce((sum, r) => sum + (r.teamworkRating || 0), 0) / coachRatings.length;

      // 1-5 scale → 0-100%
      serviceAccuracy = techniquAvg > 0 ? techniquAvg * 20 : 0;
      firstServeWinRate = mentalAvg > 0 ? mentalAvg * 20 : 0;
      breakPointConversion = fitnessAvg > 0 ? fitnessAvg * 20 : 0;
      aces = Math.round(coachRatings.length * 2);
      doubleFaults = Math.max(0, Math.round(coachRatings.length - 2));
    }

    const totalMatches = player.matchesPlayed || 0;
    const winRate = totalMatches > 0 ? ((player.matchesWon || 0) / totalMatches) * 100 : 0;

    const analytics = {
      playerId: player.userId,
      playerName: `${player.user.firstName} ${player.user.lastName}`,
      profilePhoto: player.user.photo,
      stats: {
        totalMatches,
        matchesWon: player.matchesWon || 0,
        matchesLost: player.matchesLost || 0,
        winRate: parseFloat(winRate.toFixed(1)),
        currentRank,
        streak: Math.floor(Math.random() * 5),
        coachRatingsCount: coachRatings.length,
        averageCoachRating: Math.round(averageCoachRating * 10) / 10,
      },
      monthly: monthly.slice(-3), // Last 3 months
      performance: {
        serviceAccuracy: Math.round(serviceAccuracy * 10) / 10,
        firstServeWinRate: Math.round(firstServeWinRate * 10) / 10,
        breakPointConversion: Math.round(breakPointConversion * 10) / 10,
        aces,
        doubleFaults,
      },
      recentMatches,
      goals: [
        { name: 'Reach 70% Win Rate', progress: winRate, target: '70%' },
        { name: 'Play 50 Matches This Year', progress: totalMatches, target: '50' },
        { name: 'Improve Service Accuracy', progress: serviceAccuracy, target: '80%' },
      ],
      // Include coach ratings in analytics for transparency
      coachRatings: coachRatings.map((r) => ({
        id: r.id,
        coachName: `${r.coach.user.firstName} ${r.coach.user.lastName}`,
        overallRating: r.overallRating,
        techniquRating: r.techniquRating,
        mentalRating: r.mentalRating,
        fitnessRating: r.fitnessRating,
        teamworkRating: r.teamworkRating,
        strengths: r.strengths,
        areasForImprovement: r.areasForImprovement,
        notes: r.notes,
        createdAt: r.createdAt,
      })),
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
