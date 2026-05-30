/**
 * Development Score Calculator
 * 
 * Measures:
 * - Training consistency
 * - Coach-guided improvement
 * - Skill growth trajectory
 * 
 * This is Vico's differentiator.
 */

import prisma from '@/lib/prisma';
import { FormulaVersion } from '../formulas/formula-versioning';
import { RankingCalculatorOutput } from '../types';

export async function calculateDevelopmentScore(
  playerId: string,
  organizationId: string,
  formula: FormulaVersion,
  period?: { startDate: Date; endDate: Date }
): Promise<RankingCalculatorOutput> {
  const config = formula.developmentFormula;
  
  // Get coaching sessions
  const sessions = await prisma.coachSession.findMany({
    where: {
      playerId,
      organizationId,
      status: 'completed',
      createdAt: period ? {
        gte: period.startDate,
        lte: period.endDate,
      } : undefined,
    },
  });
  
  // Get coach feedback
  const feedbacks = await prisma.coachPlayerRating.findMany({
    where: {
      playerId,
      createdAt: period ? {
        gte: period.startDate,
        lte: period.endDate,
      } : undefined,
    },
  });
  
  // Calculate base score from sessions
  let developmentScore = 0;
  
  // Points from sessions attended
  const validSessions = sessions.filter(
    s => (s.endTime.getTime() - s.startTime.getTime()) / (1000 * 60) >= config.minSessionDurationMinutes
  );
  
  developmentScore += validSessions.length * config.pointsPerSession;
  
  // Consistency bonus
  const weeksSinceFirstSession = sessions.length > 0
    ? Math.floor((Date.now() - sessions[sessions.length - 1].createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000))
    : 0;
  
  if (weeksSinceFirstSession > 0) {
    const avgSessionsPerWeek = sessions.length / Math.max(weeksSinceFirstSession, 1);
    if (avgSessionsPerWeek >= 1) {  // At least 1 session per week
      developmentScore += config.consistencyStreakBonus * Math.min(weeksSinceFirstSession, 12);
    }
  }
  
  // Coach feedback score
  if (feedbacks.length > 0) {
    const avgRating = feedbacks.reduce((sum, f) => sum + f.overallRating, 0) / feedbacks.length;
    const feedbackScore = (avgRating / 5) * 100;  // Convert to 0-100 scale
    developmentScore += feedbackScore * config.feedbackWeight;
  }
  
  // Improvement trend
  if (feedbacks.length >= 2) {
    const oldFeedback = feedbacks[feedbacks.length - 1];
    const newFeedback = feedbacks[0];
    const improvementPercent = ((newFeedback.overallRating - oldFeedback.overallRating) / oldFeedback.overallRating) * 100;
    if (improvementPercent > 0) {
      developmentScore += Math.min(improvementPercent * 10, 20);
    }
  }
  
  // Cap the score
  developmentScore = Math.min(developmentScore, config.maxScore);
  
  // Apply inactivity decay
  const lastSessionDate = sessions[0]?.createdAt || new Date();
  const daysSinceLastSession = Math.floor((Date.now() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceLastSession > config.decayAfterDays) {
    const decayWeeks = Math.floor((daysSinceLastSession - config.decayAfterDays) / 7);
    const decayAmount = decayWeeks * (config.maxScore * config.inactivityDecayPercent);
    developmentScore = Math.max(0, developmentScore - decayAmount);
  }
  
  // Get previous score
  const previousSnapshot = await prisma.developmentScoreSnapshot.findFirst({
    where: { playerId, organizationId },
    orderBy: { createdAt: 'desc' },
  });
  
  const previousScore = previousSnapshot?.currentScore || 0;
  const movement = developmentScore - previousScore;
  
  return {
    organizationId,
    playerId,
    currentScore: Math.round(developmentScore),
    previousScore: previousScore ? Math.round(previousScore) : null,
    movement: Math.round(movement),
    reason: `Based on ${validSessions.length} coaching sessions and ${feedbacks.length} feedback reviews`,
    metadata: {
      sessionsCount: validSessions.length,
      feedbackCount: feedbacks.length,
      consistencyScore: weeksSinceFirstSession > 0 ? 'high' : 'low',
      daysSinceLastSession,
    },
  };
}

/**
 * Update development score snapshot
 */
export async function updateDevelopmentScoreSnapshot(
  playerId: string,
  organizationId: string,
  newScore: number,
  previousScore: number | null
): Promise<void> {
  const existingSnapshot = await prisma.developmentScoreSnapshot.findFirst({
    where: { playerId, organizationId },
    orderBy: { createdAt: 'desc' },
  });
  
  await prisma.developmentScoreSnapshot.create({
    data: {
      playerId,
      organizationId,
      currentScore: newScore,
      previousScore: previousScore || existingSnapshot?.currentScore,
      coachingSessionsAttended: 0,  // Would be calculated above
      consistencyStreak: 0,         // Would be calculated above
      improvementTrend: 0,          // Would be calculated above
      coachAssessmentScore: 0,      // Would be calculated above
      practiceParticipation: 0,     // Would be calculated above
      lastUpdated: new Date(),
    },
  });
}
