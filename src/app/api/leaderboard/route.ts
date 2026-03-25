import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma/index.js';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const playerId = searchParams.get('playerId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Get current ISO week and year for rankings
    const now = new Date();
    const weekNum = getISOWeek(now);
    const year = now.getFullYear();

    // Build filter conditions
    const filters: any = {
      weekNumber: weekNum,
      year: year,
    };

    if (organizationId) {
      filters.organizationId = organizationId;
    }

    const rankings = await prisma.playerRanking.findMany({
      where: filters,
      include: {
        member: {
          include: {
            player: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    photo: true,
                  },
                },
              },
            },
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        currentRank: 'asc',
      },
      take: limit,
    });

    // Format rankings response
    const formattedRankings = rankings.map((ranking) => ({
      id: ranking.id,
      rank: ranking.currentRank,
      previousRank: ranking.previousRank,
      playerId: ranking.member.playerId,
      name: `${ranking.member.player?.user?.firstName} ${ranking.member.player?.user?.lastName}`,
      photo: ranking.member.player?.user?.photo,
      ratingPoints: ranking.ratingPoints,
      matchesWon: ranking.matchesWon,
      matchesLost: ranking.matchesLost,
      winRate: ranking.winRate,
      organization: ranking.organization,
      trend: ranking.previousRank && ranking.currentRank < ranking.previousRank ? 'up' : 'down',
    }));

    return NextResponse.json(formattedRankings);
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard data' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to get ISO week number
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
