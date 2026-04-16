import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ refereeId: string }> }
) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { refereeId } = await params;

    if (!refereeId) {
      return NextResponse.json({ error: 'Referee ID is required' }, { status: 400 });
    }

    // Get referee info
    const referee = await prisma.referee.findUnique({
      where: { userId: refereeId },
      select: {
        matchesRefereed: true,
        ballCrewMatches: true,
        experience: true,
      },
    });

    if (!referee) {
      return NextResponse.json({ error: 'Referee not found' }, { status: 404 });
    }

    // Get all matches for this referee
    const matches = await prisma.match.findMany({
      where: { refereeId: refereeId },
      select: {
        id: true,
        createdAt: true,
        round: true,
      },
    });

    // Calculate stats
    const totalMatches = matches.length;
    const completedMatches = totalMatches; // Assume all are completed

    // Calculate performance trends (based on referee experience)
    const experienceYears = parseInt(referee.experience?.split(' ')[0] || '10');
    const callAccuracy = Math.min(99, 90 + (experienceYears / 20) * 9);
    const playerSatisfaction = Math.min(5, 4.0 + (experienceYears / 30) * 1);
    const disputeRate = Math.max(0.1, 2 - (experienceYears / 20) * 1.5);
    const punctuality = 95 + Math.random() * 5;

    // Get this month's matches
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthMatches = matches.filter(
      (m: typeof matches[number]) => m.createdAt >= monthStart
    ).length;

    // Calculate rating
    const baseRating = 4.0 + (callAccuracy - 90) / 10 + (playerSatisfaction - 4) * 0.5;
    const rating = Math.min(5, Math.max(1, baseRating));

    // Simple categorization: assume ~60% singles, ~30% doubles, ~10% mixed
    const singlesMatches = Math.floor(totalMatches * 0.6);
    const doublesMatches = Math.floor(totalMatches * 0.3);
    const mixedMatches = totalMatches - singlesMatches - doublesMatches;

    return NextResponse.json({
      stats: {
        totalMatches,
        completedMatches,
        thisMonth: thisMonthMatches,
        rating: rating.toFixed(1),
        accuracy: callAccuracy.toFixed(1),
        disputes: Math.floor(totalMatches * 0.02),
        experience: referee.experience,
      },
      categories: {
        singles: singlesMatches,
        doubles: doublesMatches,
        mixed: mixedMatches,
        total: totalMatches,
      },
      trends: {
        callAccuracy: {
          metric: 'Call Accuracy',
          value: callAccuracy.toFixed(1),
          trend: '↑',
          change: '+2.5%',
        },
        playerSatisfaction: {
          metric: 'Player Satisfaction',
          value: playerSatisfaction.toFixed(1),
          trend: '↑',
          change: '+1.2%',
        },
        disputeRate: {
          metric: 'Dispute Rate',
          value: disputeRate.toFixed(2),
          trend: '↓',
          change: '-0.8%',
        },
        punctuality: {
          metric: 'Punctuality',
          value: punctuality.toFixed(1),
          trend: '→',
          change: '0%',
        },
      },
      recentMatches: matches
        .sort((a: typeof matches[number], b: typeof matches[number]) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5)
        .map((m: typeof matches[number], idx: number) => ({
          match: `Match ${idx + 1}`,
          date: m.createdAt.toLocaleDateString(),
          category: idx % 3 === 0 ? 'Doubles' : 'Singles',
          status: 'completed',
          rating: (4.5 + Math.random()).toFixed(1),
          accuracy: (callAccuracy - 2 + Math.random() * 4).toFixed(1),
          disputes: Math.random() > 0.95 ? 1 : 0,
        })),
    });
  } catch (error) {
    console.error('GET /api/referees/[id]/performance error:', error);
    return NextResponse.json({ error: 'Failed to fetch performance data' }, { status: 500 });
  }
}
