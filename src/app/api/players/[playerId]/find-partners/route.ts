import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET suggested partners for a player
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;

    // Get the player's data
    const player = await prisma.player.findUnique({
      where: { userId: playerId },
      select: {
        matchesWon: true,
        matchesLost: true,
        matchesPlayed: true,
      },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Find players with similar skill level and win rate
    const playerWinRate = player.matchesPlayed > 0 
      ? (player.matchesWon / player.matchesPlayed) * 100 
      : 0;

    const potentialPartners = await prisma.player.findMany({
      where: {
        userId: { not: playerId },
        matchesPlayed: { gt: 0 },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      take: 10,
    }) as any[];

    // Calculate compatibility score
    const partnersWithScore = potentialPartners.map((partner: any) => {
      const partnerWinRate = partner.matchesPlayed > 0
        ? (partner.matchesWon / partner.matchesPlayed) * 100
        : 0;

      const winRateDiff = Math.abs(playerWinRate - partnerWinRate);
      const winRateScore = 100 - Math.min(winRateDiff, 100); // 0-100 based on how close win rates are
      const compatibility = Math.round(winRateScore * 0.7);

      return {
        id: partner.userId,
        firstName: partner.user.firstName,
        lastName: partner.user.lastName,
        username: partner.user.email?.split('@')[0] || 'user',
        winRate: Math.round(partnerWinRate),
        skillLevel: 'Intermediate',
        compatibility: Math.max(0, Math.min(100, compatibility)),
      };
    });

    // Sort by compatibility
    const sorted = partnersWithScore.sort((a, b) => b.compatibility - a.compatibility);

    return NextResponse.json({ partners: sorted.slice(0, 8) });
  } catch (error) {
    console.error('Error finding partners:', error);
    return NextResponse.json({ error: 'Failed to find partners' }, { status: 500 });
  }
}
