import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        photo: true,
        gender: true,
        dateOfBirth: true,
        nationality: true,
        bio: true,
        phone: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get player info with organization and ranking
    const player = await prisma.player.findUnique({
      where: { userId: userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get current ranking if player exists
    let ranking = null;
    if (player) {
      const now = new Date();
      const weekNum = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7);
      const year = now.getFullYear();

      const playerRanking = await prisma.playerRanking.findFirst({
        where: {
          member: {
            playerId: userId,
          },
          weekNumber: weekNum,
          year: year,
        },
      });

      if (playerRanking) {
        ranking = {
          currentRank: playerRanking.currentRank,
          ratingPoints: playerRanking.ratingPoints,
          matchesWon: playerRanking.matchesWon,
          matchesLost: playerRanking.matchesLost,
          winRate: playerRanking.winRate,
        };
      }
    }

    return NextResponse.json({
      ...user,
      organization: player?.organization || null,
      ranking: ranking,
    });
  } catch (error) {
    console.error('GET /api/user/profile/[userId] error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
