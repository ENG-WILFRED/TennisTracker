/**
 * Anti-Abuse Protection System
 * 
 * Prevents gaming of the ranking system through:
 * - Diminishing returns for repetitive play against same opponent
 * - Verification requirements for ranking impact
 * - Activity spam protection with rate limiting
 * - Behavioral pattern detection
 */

import prisma from '@/lib/prisma';
import {
  AbuseType,
  AntiAbuseViolation,
  AbuseCheckContext,
  AbuseAssessment,
  AbuseRiskLevel,
  AbuseFlag,
} from '../types';

// ============================================================================
// ANTI-ABUSE CHECKER
// ============================================================================

export class AntiAbuseChecker {
  /**
   * Check for abuse violations in a ranking event
   */
  static checkForViolations(context: AbuseCheckContext): AntiAbuseViolation[] {
    const violations: AntiAbuseViolation[] = [];

    // Check for same opponent repeat abuse
    const opponentRepeatViolation = this.checkSameOpponentRepeat(context);
    if (opponentRepeatViolation) {
      violations.push(opponentRepeatViolation);
    }

    // Check for activity spam
    const spamViolation = this.checkActivitySpam(context);
    if (spamViolation) {
      violations.push(spamViolation);
    }

    // Check for unverified bookings
    const verificationViolation = this.checkVerificationRequirements(context);
    if (verificationViolation) {
      violations.push(verificationViolation);
    }

    return violations;
  }

  /**
   * Check if player is repeatedly playing same opponent
   * Apply diminishing returns
   */
  private static checkSameOpponentRepeat(
    context: AbuseCheckContext
  ): AntiAbuseViolation | null {
    const SAME_OPPONENT_THRESHOLD = 5;
    const REPEAT_PERIOD_DAYS = 30;

    if (!context.recentEvents) return null;

    const recentMatches = context.recentEvents.filter(
      (e) =>
        e.eventType.toString().includes('MATCH') &&
        new Date().getTime() - e.occurredAt.getTime() <
          REPEAT_PERIOD_DAYS * 24 * 60 * 60 * 1000
    );

    if (recentMatches.length < SAME_OPPONENT_THRESHOLD) {
      return null;
    }

    const opponentCounts: Record<string, number> = {};
    recentMatches.forEach((event) => {
      const opponent = event.sourceData.opponentId || event.sourceData.loserId;
      opponentCounts[opponent] = (opponentCounts[opponent] || 0) + 1;
    });

    const maxMatches = Math.max(...Object.values(opponentCounts));

    if (maxMatches >= SAME_OPPONENT_THRESHOLD) {
      const diminishingFactor = Math.max(
        0.3,
        1 - (maxMatches - SAME_OPPONENT_THRESHOLD) * 0.1
      );

      return {
        type: AbuseType.SAME_OPPONENT_REPEAT,
        severity: Math.min(10, maxMatches - SAME_OPPONENT_THRESHOLD),
        diminishingFactor,
        reason: `Played same opponent ${maxMatches} times in ${REPEAT_PERIOD_DAYS} days`,
        metadata: { maxMatches, periodDays: REPEAT_PERIOD_DAYS },
      };
    }

    return null;
  }

  /**
   * Check for activity spam (too many bookings/sessions)
   */
  private static checkActivitySpam(
    context: AbuseCheckContext
  ): AntiAbuseViolation | null {
    const SPAM_THRESHOLD_PER_DAY = 5;
    const SPAM_THRESHOLD_PER_WEEK = 20;

    if (!context.recentEvents) return null;

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const eventsLastDay = context.recentEvents.filter((e) => e.occurredAt > oneDayAgo);
    const eventsLastWeek = context.recentEvents.filter((e) => e.occurredAt > sevenDaysAgo);

    let violation: AntiAbuseViolation | null = null;

    if (eventsLastDay.length > SPAM_THRESHOLD_PER_DAY) {
      violation = {
        type: AbuseType.SPAM_ACTIVITY,
        severity: Math.min(10, eventsLastDay.length - SPAM_THRESHOLD_PER_DAY),
        diminishingFactor: Math.max(0.5, 1 - eventsLastDay.length * 0.05),
        reason: `${eventsLastDay.length} events in last 24 hours (limit: ${SPAM_THRESHOLD_PER_DAY})`,
        metadata: { eventsLastDay: eventsLastDay.length, eventsLastWeek: eventsLastWeek.length },
      };
    } else if (eventsLastWeek.length > SPAM_THRESHOLD_PER_WEEK) {
      violation = {
        type: AbuseType.SPAM_ACTIVITY,
        severity: Math.min(8, Math.floor((eventsLastWeek.length - SPAM_THRESHOLD_PER_WEEK) / 2)),
        diminishingFactor: Math.max(0.6, 1 - (eventsLastWeek.length - SPAM_THRESHOLD_PER_WEEK) * 0.02),
        reason: `${eventsLastWeek.length} events in last 7 days (limit: ${SPAM_THRESHOLD_PER_WEEK})`,
        metadata: { eventsLastDay: eventsLastDay.length, eventsLastWeek: eventsLastWeek.length },
      };
    }

    return violation;
  }

  /**
   * Check verification requirements are met
   */
  private static checkVerificationRequirements(
    context: AbuseCheckContext
  ): AntiAbuseViolation | null {
    const eventData = context.eventData;

    if (context.eventType.toString().includes('MATCH')) {
      if (!eventData.verifiedByReferee && !eventData.tournamentId) {
        return {
          type: AbuseType.UNVERIFIED_BOOKINGS,
          severity: 3,
          diminishingFactor: 0.7,
          reason: 'Match not verified by referee or tournament system',
          metadata: {
            verifiedByReferee: eventData.verifiedByReferee,
            tournamentId: eventData.tournamentId,
          },
        };
      }
    }

    return null;
  }

  /**
   * Calculate diminishing factor from multiple violations
   */
  static calculateDiminishingFactor(violations: AntiAbuseViolation[]): number {
    if (violations.length === 0) return 1.0;

    let factor = 1.0;
    violations.forEach((v) => {
      factor *= v.diminishingFactor;
    });

    return Math.max(0.1, factor);
  }

  /**
   * Get violation severity description
   */
  static getSeverityDescription(severity: number): string {
    if (severity >= 8) return 'CRITICAL';
    if (severity >= 6) return 'HIGH';
    if (severity >= 4) return 'MEDIUM';
    if (severity >= 2) return 'LOW';
    return 'MINIMAL';
  }
}

/**
 * Comprehensive abuse assessment for a player
 */
export async function assessAbuseRisk(
  playerId: string,
  organizationId: string
): Promise<AbuseAssessment> {
  const [
    sameOpponentScore,
    activitySpamScore,
    unverifiedScore,
    gamingScore,
  ] = await Promise.all([
    checkSameOpponentAbusePattern(playerId),
    checkActivitySpamPattern(playerId),
    checkUnverifiedMatchPattern(playerId),
    checkSystematicGamingPattern(playerId, organizationId),
  ]);
  
  const scores = [sameOpponentScore, activitySpamScore, unverifiedScore, gamingScore];
  const maxScore = Math.max(...scores);
  
  // Determine risk level
  let riskLevel = AbuseRiskLevel.SAFE;
  if (maxScore >= 0.8) riskLevel = AbuseRiskLevel.CRITICAL;
  else if (maxScore >= 0.6) riskLevel = AbuseRiskLevel.HIGH;
  else if (maxScore >= 0.4) riskLevel = AbuseRiskLevel.MEDIUM;
  else if (maxScore >= 0.2) riskLevel = AbuseRiskLevel.LOW;
  
  // Collect flags
  const flags: AbuseFlag[] = [];
  
  if (sameOpponentScore > 0.5) {
    flags.push({
      type: 'SAME_OPPONENT',
      severity: sameOpponentScore > 0.7 ? 'HIGH' : 'MEDIUM',
      description: `Player has repeated matches against same opponent (${Math.round(sameOpponentScore * 100)}% likelihood of abuse)`,
      evidence: { score: sameOpponentScore },
    });
  }
  
  if (activitySpamScore > 0.5) {
    flags.push({
      type: 'ACTIVITY_SPAM',
      severity: activitySpamScore > 0.7 ? 'HIGH' : 'MEDIUM',
      description: `Suspicious activity spike detected (bookings/sessions per day above normal)`,
      evidence: { score: activitySpamScore },
    });
  }
  
  if (unverifiedScore > 0.5) {
    flags.push({
      type: 'UNVERIFIED_MATCHES',
      severity: unverifiedScore > 0.7 ? 'HIGH' : 'MEDIUM',
      description: `Most matches are unverified/self-reported (less trustworthy)`,
      evidence: { score: unverifiedScore },
    });
  }
  
  if (gamingScore > 0.5) {
    flags.push({
      type: 'SYSTEMATIC_GAMING',
      severity: gamingScore > 0.7 ? 'HIGH' : 'MEDIUM',
      description: `Pattern suggests systematic ranking gaming behavior`,
      evidence: { score: gamingScore },
    });
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (sameOpponentScore > 0.7) {
    recommendations.push('Apply diminishing returns to matches against this opponent');
    recommendations.push('Consider marking wins as less valuable for ranking');
  }
  
  if (activitySpamScore > 0.7) {
    recommendations.push('Reduce activity points earned per booking');
    recommendations.push('Implement cooldown period between bookings');
  }
  
  if (unverifiedScore > 0.7) {
    recommendations.push('Require tournament/referee verification for rating changes');
  }
  
  if (riskLevel === AbuseRiskLevel.CRITICAL) {
    recommendations.push('Manual review recommended');
    recommendations.push('Consider temporary ranking freeze');
  }
  
  return {
    playerId,
    riskLevel,
    sameOpponentScore,
    activitySpamScore,
    unverifiedMatchScore: unverifiedScore,
    systematicGamingScore: gamingScore,
    flags,
    recommendations,
    assessedAt: new Date(),
  };
}

/**
 * Check for same opponent abuse pattern
 * 0 = safe, 1 = definite abuse
 */
async function checkSameOpponentAbusePattern(playerId: string): Promise<number> {
  // Get recent matches
  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { playerAId: playerId },
        { playerBId: playerId },
      ],
      createdAt: {
        gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // Last 60 days
      },
    },
  });
  
  if (matches.length < 5) return 0; // Not enough matches to judge
  
  // Count opponent frequency
  const opponentCounts: Record<string, number> = {};
  
  for (const match of matches) {
    const opponent = match.playerAId === playerId ? match.playerBId : match.playerAId;
    opponentCounts[opponent] = (opponentCounts[opponent] || 0) + 1;
  }
  
  // Get max opponent count
  const maxCount = Math.max(...Object.values(opponentCounts));
  
  // If playing same opponent more than 30% of matches, flag it
  const ratio = maxCount / matches.length;
  
  if (ratio > 0.5) return 1.0;  // 50% of matches against one person
  if (ratio > 0.3) return 0.7;  // 30% of matches
  if (ratio > 0.2) return 0.4;  // 20% of matches
  
  return 0;
}

/**
 * Check for activity spam pattern
 * 0 = safe, 1 = definite spam
 */
async function checkActivitySpamPattern(playerId: string): Promise<number> {
  // Get daily booking counts last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const bookings = await prisma.coachSession.findMany({
    where: {
      playerId: playerId,
      createdAt: { gte: thirtyDaysAgo },
    },
  });
  
  if (bookings.length < 3) return 0; // Not enough to judge
  
  // Calculate bookings per day
  const bookingsPerDay = bookings.length / 30;
  
  // More than 3 per day = spam
  if (bookingsPerDay > 3) return 1.0;
  if (bookingsPerDay > 2) return 0.7;
  if (bookingsPerDay > 1) return 0.4;
  
  return 0;
}

/**
 * Check for unverified matches pattern
 * 0 = mostly verified, 1 = all unverified
 */
async function checkUnverifiedMatchPattern(playerId: string): Promise<number> {
  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { playerAId: playerId },
        { playerBId: playerId },
      ],
      createdAt: {
        gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      },
    },
  });
  
  if (matches.length < 5) return 0;
  
  // Count matches without referee/tournament
  const unverifiedCount = matches.filter(m => !m.refereeId).length;
  const ratio = unverifiedCount / matches.length;
  
  if (ratio > 0.9) return 1.0;
  if (ratio > 0.7) return 0.7;
  if (ratio > 0.5) return 0.4;
  
  return 0;
}

/**
 * Check for systematic gaming patterns
 * 0 = normal, 1 = systematic gaming
 */
async function checkSystematicGamingPattern(
  playerId: string,
  organizationId: string
): Promise<number> {
  // Look for patterns in:
  // 1. Winning rate suspiciously high
  // 2. Rapid rating swings
  // 3. Always playing at specific times
  // 4. Clustering of wins/losses unnaturally
  
  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { playerAId: playerId },
        { playerBId: playerId },
      ],
      createdAt: {
        gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });
  
  if (matches.length < 10) return 0;
  
  // Calculate win rate
  const wins = matches.filter(
    m => m.winnerId === playerId
  ).length;
  
  const winRate = wins / matches.length;
  
  // Suspiciously high win rate + low match count
  if (winRate > 0.95) return 0.9;
  if (winRate > 0.85 && matches.length < 20) return 0.6;
  if (winRate > 0.8) return 0.3;
  
  return 0;
}

/**
 * Apply anti-abuse adjustments to ranking changes
 */
export function applyAbuseAdjustment(
  scoreChange: number,
  assessment: AbuseAssessment
): number {
  let multiplier = 1.0;
  
  switch (assessment.riskLevel) {
    case AbuseRiskLevel.CRITICAL:
      multiplier = 0.25;  // 75% reduction
      break;
    case AbuseRiskLevel.HIGH:
      multiplier = 0.5;   // 50% reduction
      break;
    case AbuseRiskLevel.MEDIUM:
      multiplier = 0.75;  // 25% reduction
      break;
    case AbuseRiskLevel.LOW:
      multiplier = 0.9;   // 10% reduction
      break;
    case AbuseRiskLevel.SAFE:
      multiplier = 1.0;   // No reduction
  }
  
  return scoreChange * multiplier;
}

/**
 * Check if event should be blocked due to abuse risk
 */
export async function shouldBlockEvent(
  playerId: string,
  organizationId: string,
  eventType: string
): Promise<{ blocked: boolean; reason?: string }> {
  const assessment = await assessAbuseRisk(playerId, organizationId);
  
  if (assessment.riskLevel === AbuseRiskLevel.CRITICAL) {
    return {
      blocked: true,
      reason: 'Ranking locked due to abuse risk. Contact support.',
    };
  }
  
  // Block specific event types for high-risk players
  if (assessment.riskLevel === AbuseRiskLevel.HIGH) {
    if (eventType === 'BOOKING_COMPLETED') {
      return {
        blocked: true,
        reason: 'Activity spam detected. Please wait before booking another session.',
      };
    }
  }
  
  return { blocked: false };
}
