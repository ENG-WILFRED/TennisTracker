import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET analytics for a player
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
      startDate = new Date(now.setMonth(now.getMonth() - 3));
    } else if (timeframe === '6months') {
      startDate = new Date(now.setMonth(now.getMonth() - 6));
    } else if (timeframe === 'year') {
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
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
        currentRank: Math.ceil(Math.random() * 100), // Mock rank
        streak: Math.floor(Math.random() * 5),
      },
      monthly: monthly.slice(-3), // Last 3 months
      performance: {
        serviceAccuracy: 65 + Math.random() * 20, // Mock data
        firstServeWinRate: 60 + Math.random() * 25,
        breakPointConversion: 40 + Math.random() * 30,
        aces: Math.floor(Math.random() * 50),
        doubleFaults: Math.floor(Math.random() * 20),
      },
      recentMatches,
      goals: [
        { name: 'Reach 70% Win Rate', progress: winRate, target: '70%' },
        { name: 'Play 50 Matches This Year', progress: totalMatches, target: '50' },
        { name: 'Improve Service Accuracy', progress: 75, target: '80%' },
      ],
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
