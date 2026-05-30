/**
 * Activity Score Calculator
 * 
 * Measures:
 * - Court engagement
 * - Match participation frequency
 * - Ecosystem participation
 */

import prisma from '@/lib/prisma';
import { FormulaVersion } from '../formulas/formula-versioning';
import { RankingCalculatorOutput } from '../types';

export async function calculateActivityScore(
  playerId: string,
  organizationId: string,
  formula: FormulaVersion,
  period?: { startDate: Date; endDate: Date }
): Promise<RankingCalculatorOutput> {
  const config = formula.activityFormula;
  const endDate = period?.endDate || new Date();
  const startDate = period?.startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Get court bookings
  const bookings = await prisma.courtBooking.findMany({
    where: {
      OR: [
        { memberId: (await prisma.player.findUnique({ where: { userId: playerId }, select: { userId: true } }))?.userId },
      ],
      startTime: {
        gte: startDate,
        lte: endDate,
      },
      status: { in: ['confirmed', 'completed'] },
    },
  });
  
  // Get matches played
  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { playerAId: playerId },
        { playerBId: playerId },
      ],
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
  
  // Get active days
  const activeDays = new Set<string>();
  
  bookings.forEach(b => {
    activeDays.add(b.startTime.toISOString().split('T')[0]);
  });
  
  matches.forEach(m => {
    activeDays.add(m.createdAt.toISOString().split('T')[0]);
  });
  
  // Calculate score
  let activityScore = 0;
  
  // Points from bookings
  const bookingPoints = Math.min(bookings.length, config.maxBookingsPerDay * 30) * config.pointsPerBooking;
  activityScore += bookingPoints;
  
  // Points from matches
  activityScore += matches.length * config.pointsPerMatchPlayed;
  
  // Points from active days
  activityScore += activeDays.size * config.pointsPerActiveDay;
  
  // Consecutive days bonus
  const consecutiveDays = calculateConsecutiveDays(activeDays);
  activityScore += consecutiveDays * config.consecutiveDaysBonus;
  
  // Cap the score
  activityScore = Math.min(activityScore, config.maxScore);
  
  // Inactivity decay
  if (activeDays.size === 0) {
    // No activity this period = decay
    activityScore = 0;
  }
  
  // Get previous score
  const previousSnapshot = await prisma.activityScoreSnapshot.findFirst({
    where: { playerId, organizationId },
    orderBy: { createdAt: 'desc' },
  });
  
  const previousScore = previousSnapshot?.currentScore || 0;
  const movement = activityScore - previousScore;
  
  return {
    organizationId,
    playerId,
    currentScore: Math.round(activityScore),
    previousScore: previousScore ? Math.round(previousScore) : null,
    movement: Math.round(movement),
    reason: `Based on ${bookings.length} bookings, ${matches.length} matches, ${activeDays.size} active days`,
    metadata: {
      bookingsCount: bookings.length,
      matchesCount: matches.length,
      activeDaysCount: activeDays.size,
      consecutiveDays,
    },
  };
}

/**
 * Calculate consecutive active days
 */
function calculateConsecutiveDays(activeDays: Set<string>): number {
  const sortedDays = Array.from(activeDays).sort();
  
  let maxConsecutive = 0;
  let currentConsecutive = 1;
  
  for (let i = 1; i < sortedDays.length; i++) {
    const current = new Date(sortedDays[i]);
    const previous = new Date(sortedDays[i - 1]);
    
    const dayDiff = Math.floor((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 1) {
      currentConsecutive++;
    } else {
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      currentConsecutive = 1;
    }
  }
  
  return Math.max(maxConsecutive, currentConsecutive);
}

/**
 * Update activity score snapshot
 */
export async function updateActivityScoreSnapshot(
  playerId: string,
  organizationId: string,
  newScore: number,
  previousScore: number | null
): Promise<void> {
  const existingSnapshot = await prisma.activityScoreSnapshot.findFirst({
    where: { playerId, organizationId },
    orderBy: { createdAt: 'desc' },
  });
  
  await prisma.activityScoreSnapshot.create({
    data: {
      playerId,
      organizationId,
      currentScore: newScore,
      previousScore: previousScore || existingSnapshot?.currentScore,
      bookingsThisMonth: 0,    // Would be calculated above
      courtAppearances: 0,
      matchesPlayed: 0,
      recentParticipationFrequency: 0,
      consecutiveDaysActive: 0,
      lastUpdated: new Date(),
    },
  });
}
