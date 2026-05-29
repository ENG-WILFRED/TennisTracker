/**
 * Ranking Confidence System
 * 
 * Prevents new players from instantly dominating rankings
 * Adds provisional status to rankings with low sample size
 * Improves fairness by acknowledging uncertainty
 */

import { RankingConfidence } from '../types';

// ============================================================================
// CONFIDENCE CALCULATOR
// ============================================================================

export class ConfidenceCalculator {
  /**
   * Calculate confidence for competitive ranking
   * Based on number of matches and rating stability
   */
  static calculateCompetitiveConfidence(
    matchesPlayed: number,
    winRate: number,
    ratingChangePercentage: number
  ): RankingConfidence {
    const MIN_MATCHES_HIGH_CONFIDENCE = 30;
    const MIN_MATCHES_MEDIUM_CONFIDENCE = 15;
    const MIN_MATCHES_LOW_CONFIDENCE = 5;
    const STABILITY_THRESHOLD = 0.1;

    let confidenceScore = 50;

    if (matchesPlayed >= MIN_MATCHES_HIGH_CONFIDENCE) {
      confidenceScore = Math.min(100, confidenceScore + 30);
    } else if (matchesPlayed >= MIN_MATCHES_MEDIUM_CONFIDENCE) {
      confidenceScore = Math.min(100, confidenceScore + 15);
    } else if (matchesPlayed < MIN_MATCHES_LOW_CONFIDENCE) {
      confidenceScore = Math.max(20, confidenceScore - 20);
    }

    const winRateDiff = Math.abs(winRate - 50);
    if (winRateDiff < 15) {
      confidenceScore += 10;
    }

    if (ratingChangePercentage > STABILITY_THRESHOLD) {
      confidenceScore -= Math.min(20, ratingChangePercentage * 100);
    }

    const isProvisional = matchesPlayed < MIN_MATCHES_MEDIUM_CONFIDENCE;

    return {
      confidenceScore: Math.max(0, Math.min(100, confidenceScore)),
      isProvisional,
      matchesConsidered: matchesPlayed,
      minMatchesRequired: MIN_MATCHES_MEDIUM_CONFIDENCE,
      provisionalReason: isProvisional
        ? `Only ${matchesPlayed} matches played (${MIN_MATCHES_MEDIUM_CONFIDENCE} needed for full confidence)`
        : undefined,
      trustLevel:
        confidenceScore >= 80 ? 'HIGH' : confidenceScore >= 50 ? 'MEDIUM' : 'LOW',
    };
  }

  /**
   * Calculate confidence for development ranking
   * Based on coaching sessions attended and consistency
   */
  static calculateDevelopmentConfidence(
    sessionsAttended: number,
    consistencyStreak: number,
    feedbackScore: number
  ): RankingConfidence {
    const MIN_SESSIONS_HIGH_CONFIDENCE = 20;
    const MIN_SESSIONS_MEDIUM_CONFIDENCE = 10;
    const MIN_CONSISTENCY_DAYS = 30;

    let confidenceScore = 50;

    if (sessionsAttended >= MIN_SESSIONS_HIGH_CONFIDENCE) {
      confidenceScore += 30;
    } else if (sessionsAttended >= MIN_SESSIONS_MEDIUM_CONFIDENCE) {
      confidenceScore += 15;
    } else {
      confidenceScore -= 15;
    }

    if (consistencyStreak >= MIN_CONSISTENCY_DAYS) {
      confidenceScore += 20;
    } else if (consistencyStreak > 0) {
      confidenceScore += (consistencyStreak / MIN_CONSISTENCY_DAYS) * 15;
    }

    if (feedbackScore >= 4) {
      confidenceScore += 15;
    } else if (feedbackScore >= 3) {
      confidenceScore += 5;
    }

    const isProvisional = sessionsAttended < MIN_SESSIONS_MEDIUM_CONFIDENCE;

    return {
      confidenceScore: Math.max(0, Math.min(100, confidenceScore)),
      isProvisional,
      matchesConsidered: sessionsAttended,
      minMatchesRequired: MIN_SESSIONS_MEDIUM_CONFIDENCE,
      provisionalReason: isProvisional
        ? `Only ${sessionsAttended} sessions attended (${MIN_SESSIONS_MEDIUM_CONFIDENCE} needed)`
        : undefined,
      trustLevel:
        confidenceScore >= 80 ? 'HIGH' : confidenceScore >= 50 ? 'MEDIUM' : 'LOW',
    };
  }

  /**
   * Calculate confidence for activity ranking
   * Based on recent participation frequency
   */
  static calculateActivityConfidence(
    bookingsThisMonth: number,
    consecutiveDaysActive: number,
    lastActivityDaysAgo: number
  ): RankingConfidence {
    const TARGET_BOOKINGS_MONTHLY = 12;
    const INACTIVITY_THRESHOLD = 30;

    let confidenceScore = 50;

    const bookingRatio = Math.min(1, bookingsThisMonth / TARGET_BOOKINGS_MONTHLY);
    confidenceScore += bookingRatio * 30;

    if (consecutiveDaysActive >= 30) {
      confidenceScore += 25;
    } else if (consecutiveDaysActive > 0) {
      confidenceScore += (consecutiveDaysActive / 30) * 20;
    }

    if (lastActivityDaysAgo <= 7) {
      confidenceScore += 15;
    } else if (lastActivityDaysAgo <= 14) {
      confidenceScore += 10;
    } else if (lastActivityDaysAgo > INACTIVITY_THRESHOLD) {
      confidenceScore -= 20;
    }

    const isProvisional =
      bookingsThisMonth < 4 || consecutiveDaysActive < 7;

    return {
      confidenceScore: Math.max(0, Math.min(100, confidenceScore)),
      isProvisional,
      matchesConsidered: bookingsThisMonth,
      minMatchesRequired: 4,
      provisionalReason: isProvisional
        ? `Low activity this month (${bookingsThisMonth} bookings)`
        : undefined,
      trustLevel:
        confidenceScore >= 80 ? 'HIGH' : confidenceScore >= 50 ? 'MEDIUM' : 'LOW',
    };
  }
}
