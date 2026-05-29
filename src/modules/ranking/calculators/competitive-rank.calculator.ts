/**
 * Competitive Rank Calculator
 * Computes competitive strength based on:
 * - Tournament wins
 * - Verified match wins/losses
 * - Opponent difficulty (ELO-like)
 * - Tournament tier
 * - Win/loss ratio
 */

import prisma from '@/lib/prisma';
import { RankingCalculatorInput, RankingCalculatorOutput } from '../types';

const BASE_RATING = 1500; // ELO starting point
const K_FACTOR = 32; // ELO K-factor (determines swing)
const INACTIVITY_DECAY = 0.02; // 2% per week of inactivity

interface PlayerStats {
  matchesWon: number;
  matchesLost: number;
  tournamentWins: number;
  lastMatchDate: Date | null;
}

interface OpponentProfile {
  rating: number;
  recentMatches: number;
}

/**
 * Calculate opponent difficulty (average ELO of opponents faced)
 */
async function calculateOpponentStrength(
  organizationId: string,
  playerId: string,
  period?: { startDate: Date; endDate: Date }
): Promise<number> {
  const query = prisma.match.findMany({
    where: {
      OR: [
        { playerAId: playerId },
        { playerBId: playerId },
      ],
      createdAt: period ? {
        gte: period.startDate,
        lte: period.endDate,
      } : undefined,
    },
    select: {
      playerAId: true,
      playerBId: true,
      playerA: { select: { ratingPoints: true } },
      playerB: { select: { ratingPoints: true } },
    },
  });

  const matches = await query;
  if (matches.length === 0) return BASE_RATING;

  const opponentRatings = matches.map(match => {
    const opponentRating = match.playerAId === playerId
      ? match.playerB.ratingPoints
      : match.playerA.ratingPoints;
    return opponentRating;
  });

  const avgOpponentRating = opponentRatings.reduce((a, b) => a + b, 0) / opponentRatings.length;
  return avgOpponentRating;
}

/**
 * Calculate win rate (0-100)
 */
function calculateWinRate(matchesWon: number, matchesLost: number): number {
  const total = matchesWon + matchesLost;
  if (total === 0) return 0;
  return (matchesWon / total) * 100;
}

/**
 * Calculate ELO rating change
 */
function calculateELOChange(
  playerRating: number,
  opponentRating: number,
  didWin: boolean
): number {
  // Expected score calculation
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const actualScore = didWin ? 1 : 0;
  const ratingChange = K_FACTOR * (actualScore - expectedScore);
  return Math.round(ratingChange);
}

/**
 * Apply time decay for inactivity
 */
function calculateTimeDecay(lastActivityDate: Date | null): number {
  if (!lastActivityDate) return 0;
  
  const daysSinceActivity = Math.floor(
    (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const weeksSinceActivity = Math.floor(daysSinceActivity / 7);
  
  // Decay 2% per week, max 20% decay
  const decay = Math.min(weeksSinceActivity * INACTIVITY_DECAY, 0.20);
  return decay;
}

/**
 * Main competitive rank calculator
 */
export async function calculateCompetitiveRank(
  input: RankingCalculatorInput
): Promise<RankingCalculatorOutput> {
  const { organizationId, playerId, period } = input;

  // Get player's current stats
  const player = await prisma.player.findUnique({
    where: { userId: playerId },
    select: {
      matchesWon: true,
      matchesLost: true,
      ratingPoints: true,
    },
  });

  if (!player) {
    return {
      organizationId,
      playerId,
      currentScore: BASE_RATING,
      previousScore: null,
      movement: 0,
      reason: 'Player not found, using base rating',
      metadata: {},
    };
  }

  // Get previous snapshot for comparison
  const previousSnapshot = await prisma.competitiveRankSnapshot.findUnique({
    where: {
      organizationId_playerId: { organizationId, playerId },
    },
  });

  const previousScore = previousSnapshot?.currentScore || BASE_RATING;

  // Calculate opponent strength
  const opponentStrength = await calculateOpponentStrength(organizationId, playerId, period);

  // Calculate win rate
  const winRate = calculateWinRate(player.matchesWon, player.matchesLost);

  // Calculate ELO adjustments from recent matches
  let eloAdjustment = 0;
  const recentMatches = await prisma.match.findMany({
    where: {
      OR: [
        { playerAId: playerId },
        { playerBId: playerId },
      ],
      createdAt: period ? {
        gte: period.startDate,
        lte: period.endDate,
      } : undefined,
    },
    orderBy: { createdAt: 'desc' },
    take: 10, // Last 10 matches
    select: {
      playerAId: true,
      playerBId: true,
      winnerId: true,
      playerA: { select: { ratingPoints: true } },
      playerB: { select: { ratingPoints: true } },
    },
  });

  for (const match of recentMatches) {
    const didWin = match.winnerId === playerId;
    const opponentRating = match.playerAId === playerId
      ? match.playerB.ratingPoints
      : match.playerA.ratingPoints;
    
    eloAdjustment += calculateELOChange(player.ratingPoints, opponentRating, didWin);
  }

  // Apply time decay
  const lastMatch = await prisma.match.findFirst({
    where: {
      OR: [
        { playerAId: playerId },
        { playerBId: playerId },
      ],
    },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  const timeDecay = calculateTimeDecay(lastMatch?.createdAt || null);
  const decayPenalty = Math.round(player.ratingPoints * timeDecay);

  // Final score
  const currentScore = Math.max(BASE_RATING, player.ratingPoints + eloAdjustment - decayPenalty);
  const movement = currentScore - previousScore;

  return {
    organizationId,
    playerId,
    currentScore,
    previousScore,
    movement,
    reason: `ELO: ${eloAdjustment}, Decay: ${decayPenalty}, OpponentStrength: ${Math.round(opponentStrength)}, WinRate: ${Math.round(winRate)}%`,
    metadata: {
      matchesWon: player.matchesWon,
      matchesLost: player.matchesLost,
      winRate: Math.round(winRate),
      opponentStrength: Math.round(opponentStrength),
      eloAdjustment,
      decayPenalty,
      recentMatches: recentMatches.length,
    },
  };
}

export async function updateCompetitiveRankSnapshot(
  input: RankingCalculatorInput
): Promise<void> {
  const result = await calculateCompetitiveRank(input);

  await prisma.competitiveRankSnapshot.upsert({
    where: {
      organizationId_playerId: {
        organizationId: input.organizationId,
        playerId: input.playerId,
      },
    },
    create: {
      id: `comp-rank-${input.playerId}-${Date.now()}`,
      organizationId: input.organizationId,
      playerId: input.playerId,
      currentScore: result.currentScore,
      previousScore: result.previousScore,
      matchesWon: result.metadata.matchesWon || 0,
      matchesLost: result.metadata.matchesLost || 0,
      winRate: result.metadata.winRate || 0,
      tournamentWins: 0, // TODO: Calculate from tournament data
      opponentStrengthAvg: result.metadata.opponentStrength || 0,
    },
    update: {
      previousScore: result.previousScore,
      currentScore: result.currentScore,
      matchesWon: result.metadata.matchesWon || 0,
      matchesLost: result.metadata.matchesLost || 0,
      winRate: result.metadata.winRate || 0,
      opponentStrengthAvg: result.metadata.opponentStrength || 0,
      lastUpdated: new Date(),
    },
  });
}
