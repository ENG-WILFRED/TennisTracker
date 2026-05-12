import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Calculate Elo-style rating change
 * Based on opponent's rating and whether the result was a win or loss
 */
function calculateRatingChange(
  playerRating: number,
  opponentRating: number,
  playerWon: boolean,
  kFactor: number = 32
): number {
  const ratingDiff = opponentRating - playerRating;
  const expectedScore = 1 / (1 + Math.pow(10, ratingDiff / 400));
  const actualScore = playerWon ? 1 : 0;
  const ratingChange = Math.round(kFactor * (actualScore - expectedScore));
  return ratingChange;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { challengeId, winnerId, score } = body;

    if (!challengeId || !winnerId) {
      return NextResponse.json(
        { error: 'Missing challengeId or winnerId' },
        { status: 400 }
      );
    }

    const challenge = await prisma.rankingChallenge.findUnique({
      where: { id: challengeId },
      include: {
        challenger: {
          include: {
            player: {
              include: {
                user: true,
              },
            },
          },
        },
        opponent: {
          include: {
            player: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    if (challenge.status !== 'pending') {
      return NextResponse.json(
        { error: 'Challenge has already been completed' },
        { status: 400 }
      );
    }

    // Determine winner and loser
    const isChallengeeWinner = winnerId === challenge.challenger.playerId;
    const winnerMembership = isChallengeeWinner ? challenge.challenger : challenge.opponent;
    const loserMembership = isChallengeeWinner ? challenge.opponent : challenge.challenger;

    const winnerPlayer = winnerMembership.player;
    const loserPlayer = loserMembership.player;

    // Get current ratings
    const winnerCurrentRating = winnerPlayer.ratingPoints || 1500;
    const loserCurrentRating = loserPlayer.ratingPoints || 1500;

    // Calculate rating changes
    const winnerRatingChange = calculateRatingChange(
      winnerCurrentRating,
      loserCurrentRating,
      true
    );
    const loserRatingChange = calculateRatingChange(
      loserCurrentRating,
      winnerCurrentRating,
      false
    );

    const updatedWinnerMatchesWon = (winnerPlayer.matchesWon || 0) + 1;
    const updatedWinnerMatchesTotal = updatedWinnerMatchesWon + (winnerPlayer.matchesLost || 0);
    const updatedLoserMatchesLost = (loserPlayer.matchesLost || 0) + 1;
    const updatedLoserMatchesTotal = (loserPlayer.matchesWon || 0) + updatedLoserMatchesLost;

    // Update player ratings and statistics
    const [updatedWinner, updatedLoser] = await Promise.all([
      prisma.player.update({
        where: { userId: winnerPlayer.userId },
        data: {
          ratingPoints: Math.max(0, winnerCurrentRating + winnerRatingChange),
          matchesWon: updatedWinnerMatchesWon,
          winRate: updatedWinnerMatchesTotal > 0 ? Math.round((updatedWinnerMatchesWon / updatedWinnerMatchesTotal) * 100) : 0,
        },
      }),
      prisma.player.update({
        where: { userId: loserPlayer.userId },
        data: {
          ratingPoints: Math.max(0, loserCurrentRating + loserRatingChange),
          matchesLost: updatedLoserMatchesLost,
          winRate: updatedLoserMatchesTotal > 0 ? Math.round((loserPlayer.matchesWon || 0) / updatedLoserMatchesTotal * 100) : 0,
        },
      }),
    ]);

    // Update challenge status
    const updatedChallenge = await prisma.rankingChallenge.update({
      where: { id: challengeId },
      data: {
        status: 'completed',
        winnerId: winnerPlayer.userId,
        matchDate: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      challenge: updatedChallenge,
      winner: {
        userId: winnerPlayer.userId,
        name: `${winnerPlayer.user.firstName} ${winnerPlayer.user.lastName}`,
        email: winnerPlayer.user.email,
        previousRating: winnerCurrentRating,
        newRating: updatedWinner.ratingPoints,
        ratingChange: winnerRatingChange,
        matchesWon: updatedWinner.matchesWon,
        winRate: updatedWinner.winRate,
      },
      loser: {
        userId: loserPlayer.userId,
        name: `${loserPlayer.user.firstName} ${loserPlayer.user.lastName}`,
        email: loserPlayer.user.email,
        previousRating: loserCurrentRating,
        newRating: updatedLoser.ratingPoints,
        ratingChange: loserRatingChange,
        matchesLost: updatedLoser.matchesLost,
        winRate: updatedLoser.winRate,
      },
    });
  } catch (error) {
    console.error('Error completing challenge:', error);
    return NextResponse.json(
      { error: 'Failed to complete challenge' },
      { status: 500 }
    );
  }
}
