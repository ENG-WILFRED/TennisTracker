/**
 * Explanation Engine
 * 
 * Generates human-readable explanations for ranking changes
 * Powers the "why did my score change?" feature
 * Builds user trust through transparency
 */

import type {
  RankingExplanation,
  ExplanationFactor,
  RankingDimension,
  CalculationFactor,
} from '../types';
import { RankingDimension as RankingDimensionEnum } from '../events/ranking-events';

export class ExplanationEngine {
  /**
   * Generate explanation from calculation factors
   */
  static generateExplanation(
    dimension: RankingDimension,
    factors: CalculationFactor[],
    scoreDelta: number
  ): RankingExplanation {
    const isPositive = scoreDelta > 0;
    const sortedFactors = factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
    const topFactors = sortedFactors.slice(0, 3);

    const explanationFactors: ExplanationFactor[] = topFactors.map((factor) => ({
      name: factor.name,
      description: factor.description,
      contribution: factor.impact,
      percentage: Math.abs(factor.impact) / Math.abs(scoreDelta),
    }));

    const title = this.generateTitle(dimension, isPositive, topFactors);
    const description = this.generateDescription(dimension, topFactors, scoreDelta);

    return {
      title,
      description,
      pointsChange: scoreDelta,
      dimension,
      factors: explanationFactors,
      isPositive,
      importance: this.calculateImportance(Math.abs(scoreDelta)),
    };
  }

  private static generateTitle(
    dimension: RankingDimension,
    isPositive: boolean,
    topFactors: CalculationFactor[]
  ): string {
    const primaryFactor = topFactors[0]?.name || 'Activity';
    const direction = isPositive ? 'improved' : 'declined';

    switch (dimension) {
      case RankingDimensionEnum.COMPETITIVE:
        return isPositive
          ? `Strong ${primaryFactor} boost your competitive rank`
          : `${primaryFactor} reduced your competitive rank`;

      case RankingDimensionEnum.DEVELOPMENT:
        return isPositive
          ? `Great progress in ${primaryFactor}`
          : `Development score declined due to ${primaryFactor}`;

      case RankingDimensionEnum.ACTIVITY:
        return isPositive
          ? `Your court presence ${direction}`
          : `Activity level decreased`;

      default:
        return `Your overall index ${direction}`;
    }
  }

  private static generateDescription(
    dimension: RankingDimension,
    topFactors: CalculationFactor[],
    scoreDelta: number
  ): string {
    const delta = Math.abs(scoreDelta).toFixed(1);
    const factors = topFactors.map((f) => f.description).join(', ');

    switch (dimension) {
      case RankingDimensionEnum.COMPETITIVE:
        return `Your competitive rank ${scoreDelta > 0 ? 'increased' : 'decreased'} by ${delta} points. Main contributors: ${factors}.`;

      case RankingDimensionEnum.DEVELOPMENT:
        return `Your development score changed by ${delta} points. Based on: ${factors}.`;

      case RankingDimensionEnum.ACTIVITY:
        return `Your activity score ${scoreDelta > 0 ? 'increased' : 'decreased'} by ${delta} points due to: ${factors}.`;

      default:
        return `Your overall index ${scoreDelta > 0 ? 'improved' : 'declined'} by ${delta} points.`;
    }
  }

  private static calculateImportance(magnitude: number): number {
    if (magnitude >= 50) return 10;
    if (magnitude >= 30) return 9;
    if (magnitude >= 20) return 8;
    if (magnitude >= 10) return 7;
    if (magnitude >= 5) return 5;
    if (magnitude >= 1) return 3;
    return 1;
  }

  /**
   * Generate explanation for inactivity penalties
   */
  static generateInactivityExplanation(daysSinceLastActivity: number): RankingExplanation {
    let points = 0;
    if (daysSinceLastActivity > 30) points = -3;
    else if (daysSinceLastActivity > 60) points = -6;
    else if (daysSinceLastActivity > 90) points = -10;

    return {
      title: 'Inactivity penalty applied',
      description: `No activity detected for ${daysSinceLastActivity} days. Regular participation helps maintain your ranking.`,
      pointsChange: points,
      dimension: RankingDimensionEnum.ACTIVITY,
      factors: [
        {
          name: 'Inactivity period',
          description: `${daysSinceLastActivity} days without activity`,
          contribution: points,
          percentage: 1,
        },
      ],
      isPositive: false,
      importance: Math.min(10, Math.floor(daysSinceLastActivity / 30)),
    };
  }

  /**
   * Generate explanation for provisional rankings
   */
  static generateProvisionalExplanation(
    dimension: RankingDimension,
    samplesRequired: number,
    samplesAvailable: number
  ): string {
    const remaining = samplesRequired - samplesAvailable;
    return `This ${dimension.toLowerCase()} ranking is provisional. Need ${remaining} more ${this.getSampleLabel(dimension)} for full confidence.`;
  }

  private static getSampleLabel(dimension: RankingDimension): string {
    switch (dimension) {
      case RankingDimensionEnum.COMPETITIVE:
        return 'matches';
      case RankingDimensionEnum.DEVELOPMENT:
        return 'coaching sessions';
      case RankingDimensionEnum.ACTIVITY:
        return 'court appearances';
      default:
        return 'events';
    }
  }
}

/**
 * Competitive Rank Explanation
 */
export class CompetitiveRankExplainer {
  explain(
    previousScore: number,
    currentScore: number,
    recentMatches: any[],
    metadata: any
  ): RankingExplanation {
    const delta = currentScore - previousScore;
    const deltaPercentage = (delta / previousScore) * 100;
    
    // Build factors
    const factors: ExplanationFactor[] = [];
    
    // Match results
    const wins = recentMatches.filter(m => m.won).length;
    const losses = recentMatches.filter(m => !m.won).length;
    
    if (wins > 0) {
      factors.push({
        type: 'MATCH_WINS',
        weight: 0.6,
        impact: wins * 15,  // Approx 15 points per win
        description: `Won ${wins} match${wins > 1 ? 'es' : ''} against competitive opponents`,
        evidence: {
          wins,
          averageOpponentRating: metadata.avgOpponentRating,
        },
      });
    }
    
    if (losses > 0) {
      factors.push({
        type: 'MATCH_LOSSES',
        weight: 0.4,
        impact: -losses * 10,
        description: `Lost ${losses} match${losses > 1 ? 'es' : ''}`,
        evidence: { losses },
      });
    }
    
    // Opponent strength
    if (metadata.avgOpponentRating > metadata.playerRating) {
      factors.push({
        type: 'OPPONENT_STRENGTH',
        weight: 0.3,
        impact: Math.min(metadata.avgOpponentRating - metadata.playerRating, 50),
        description: `Playing against stronger opponents boosts your rating when you win`,
        evidence: { avgOpponentRating: metadata.avgOpponentRating },
      });
    }
    
    // Inactivity
    if (metadata.daysSinceLastMatch > 30) {
      factors.push({
        type: 'INACTIVITY',
        weight: 0.2,
        impact: -Math.min(metadata.daysSinceLastMatch / 10, 40),
        description: `Inactive for ${metadata.daysSinceLastMatch} days (ranking decays slowly)`,
        evidence: { daysSinceLastMatch: metadata.daysSinceLastMatch },
      });
    }
    
    // Consistency
    if (metadata.winRate > 60) {
      factors.push({
        type: 'CONSISTENCY',
        weight: 0.25,
        impact: (metadata.winRate - 50) * 0.5,
        description: `${Math.round(metadata.winRate)}% win rate shows strong consistency`,
        evidence: { winRate: metadata.winRate },
      });
    }
    
    // Build headline
    let headline = '';
    if (delta > 50) headline = '📈 Strong improvement!';
    else if (delta > 20) headline = '👍 Rating increased';
    else if (delta > 0) headline = '✓ Slight improvement';
    else if (delta > -20) headline = '↔ Rating stable';
    else if (delta > -50) headline = '👎 Rating declined';
    else headline = '📉 Significant drop';
    
    return {
      playerId: metadata.playerId,
      dimension: RankingDimensionEnum.COMPETITIVE,
      headline,
      explanation: this.buildExplanation(
        previousScore,
        currentScore,
        wins,
        losses,
        metadata
      ),
      previousScore,
      currentScore,
      pointsChange: delta,
      scoreDelta: delta,
      deltaPercentage,
      isPositive: delta > 0,
      importance: Math.min(10, Math.max(1, Math.round(Math.abs(delta) / 10))),
      factors,
      periodDescription: `Last ${metadata.periodDays || 30} days`,
      calculatedAt: new Date(),
    };
  }
  
  private buildExplanation(
    prev: number,
    current: number,
    wins: number,
    losses: number,
    meta: any
  ): string {
    const delta = current - prev;
    const trend = delta > 0 ? 'improved' : 'declined';
    
    return `Your competitive rating ${trend} from ${Math.round(prev)} to ${Math.round(current)}. ` +
           `You played ${wins + losses} matches with ${wins} wins. ` +
           `Your win rate of ${Math.round(meta.winRate)}% demonstrates your current skill level. ` +
           `Keep playing to solidify your ranking!`;
  }
}

/**
 * Development Score Explanation
 */
export class DevelopmentScoreExplainer {
  explain(
    previousScore: number,
    currentScore: number,
    sessionsAttended: number,
    feedbackScore: number,
    improvementTrend: number,
    metadata: any
  ): RankingExplanation {
    const delta = currentScore - previousScore;
    const factors: ExplanationFactor[] = [];
    
    if (sessionsAttended > 0) {
      factors.push({
        type: 'COACHING_SESSIONS',
        weight: 0.4,
        impact: sessionsAttended * 5,
        description: `Attended ${sessionsAttended} coaching session${sessionsAttended > 1 ? 's' : ''}`,
        evidence: { sessionsAttended },
      });
    }
    
    if (feedbackScore > 0) {
      factors.push({
        type: 'COACH_FEEDBACK',
        weight: 0.35,
        impact: feedbackScore * 0.5,
        description: `Coach feedback shows score of ${Math.round(feedbackScore)}/100`,
        evidence: { feedbackScore },
      });
    }
    
    if (improvementTrend > 0) {
      factors.push({
        type: 'IMPROVEMENT_TREND',
        weight: 0.25,
        impact: improvementTrend,
        description: `Show ${Math.round(improvementTrend)}% improvement over time`,
        evidence: { improvementTrend },
      });
    }
    
    if (metadata.daysSinceLastSession > 14) {
      factors.push({
        type: 'INACTIVITY',
        weight: 0.15,
        impact: -Math.min(metadata.daysSinceLastSession / 7, 10),
        description: `No sessions for ${metadata.daysSinceLastSession} days`,
        evidence: { daysSinceLastSession: metadata.daysSinceLastSession },
      });
    }
    
    return {
      playerId: metadata.playerId,
      dimension: RankingDimensionEnum.DEVELOPMENT,
      headline: delta > 0 ? '🎯 Progress detected!' : '⏸ Growth slowing',
      explanation: `Your development score reflects your training consistency and improvement. ` +
                   `You're building skills through ${sessionsAttended} coaching session${sessionsAttended !== 1 ? 's' : ''}. ` +
                   `Keep attending regular sessions to accelerate your growth!`,
      previousScore,
      currentScore,
      pointsChange: delta,
      scoreDelta: delta,
      deltaPercentage: (delta / previousScore) * 100,
      isPositive: delta > 0,
      importance: Math.min(10, Math.max(1, Math.round(Math.abs(delta) / 10))),
      factors,
      periodDescription: 'Last 30 days',
      calculatedAt: new Date(),
    };
  }
}

/**
 * Activity Score Explanation
 */
export class ActivityScoreExplainer {
  explain(
    previousScore: number,
    currentScore: number,
    bookingsCount: number,
    matchesPlayed: number,
    activeDays: number,
    metadata: any
  ): RankingExplanation {
    const delta = currentScore - previousScore;
    const factors: ExplanationFactor[] = [];
    
    if (bookingsCount > 0) {
      factors.push({
        type: 'BOOKINGS',
        weight: 0.35,
        impact: bookingsCount * 2,
        description: `Made ${bookingsCount} court bookings`,
        evidence: { bookingsCount },
      });
    }
    
    if (matchesPlayed > 0) {
      factors.push({
        type: 'MATCHES_PLAYED',
        weight: 0.4,
        impact: matchesPlayed * 3,
        description: `Played ${matchesPlayed} match${matchesPlayed > 1 ? 'es' : ''}`,
        evidence: { matchesPlayed },
      });
    }
    
    if (activeDays > 0) {
      factors.push({
        type: 'ACTIVE_DAYS',
        weight: 0.25,
        impact: activeDays * 0.5,
        description: `Active on ${activeDays} different days`,
        evidence: { activeDays },
      });
    }
    
    return {
      playerId: metadata.playerId,
      dimension: RankingDimensionEnum.ACTIVITY,
      headline: delta > 0 ? '🏃 Active engagement!' : '💤 Activity dropping',
      explanation: `Your activity score measures court engagement and match participation. ` +
                   `You've booked ${bookingsCount} times and played ${matchesPlayed} match${matchesPlayed !== 1 ? 'es' : ''}. ` +
                   `More court time = higher activity score!`,
      previousScore,
      currentScore,
      pointsChange: delta,
      scoreDelta: delta,
      deltaPercentage: (delta / previousScore) * 100,
      isPositive: delta > 0,
      importance: Math.min(10, Math.max(1, Math.round(Math.abs(delta) / 10))),
      factors,
      periodDescription: 'Last 30 days',
      calculatedAt: new Date(),
    };
  }
}

/**
 * Overall Index Explanation
 */
export class OverallIndexExplainer {
  explain(
    competitiveScore: number,
    developmentScore: number,
    activityScore: number,
    competitiveWeight: number,
    developmentWeight: number,
    activityWeight: number,
    previousIndex: number,
    currentIndex: number,
    metadata: any
  ): RankingExplanation {
    const delta = currentIndex - previousIndex;
    const factors: ExplanationFactor[] = [];
    
    factors.push({
      type: 'COMPETITIVE',
      weight: competitiveWeight,
      impact: competitiveScore * competitiveWeight,
      description: `Competitive ranking: ${Math.round(competitiveScore)}/2500 (${Math.round(competitiveWeight * 100)}% weight)`,
      evidence: { score: competitiveScore },
    });
    
    factors.push({
      type: 'DEVELOPMENT',
      weight: developmentWeight,
      impact: developmentScore * developmentWeight,
      description: `Development score: ${Math.round(developmentScore)}/100 (${Math.round(developmentWeight * 100)}% weight)`,
      evidence: { score: developmentScore },
    });
    
    factors.push({
      type: 'ACTIVITY',
      weight: activityWeight,
      impact: activityScore * activityWeight,
      description: `Activity engagement: ${Math.round(activityScore)}/100 (${Math.round(activityWeight * 100)}% weight)`,
      evidence: { score: activityScore },
    });
    
    return {
      playerId: metadata.playerId,
      dimension: RankingDimensionEnum.OVERALL_INDEX,
      headline: '🎪 Your Vico Profile Score',
      explanation: `Your overall Vico score combines three dimensions: strength (competitive), ` +
                   `growth (development), and engagement (activity). ` +
                   `Improve in all areas to climb the rankings!`,
      previousScore: previousIndex,
      currentScore: currentIndex,
      pointsChange: delta,
      scoreDelta: delta,
      deltaPercentage: (delta / previousIndex) * 100,
      isPositive: delta > 0,
      importance: Math.min(10, Math.max(1, Math.round(Math.abs(delta) / 10))),
      factors,
      periodDescription: 'Last 30 days',
      calculatedAt: new Date(),
    };
  }
}

/**
 * Store explanations in database for audit trail
 */
export interface StoredExplanation {
  id: string;
  playerId: string;
  organizationId: string;
  dimension: RankingDimension;
  explanation: RankingExplanation;
  createdAt: Date;
}
