/**
 * Ranking System Types
 */

export type RankingDimension =
  | 'COMPETITIVE'
  | 'DEVELOPMENT'
  | 'ACTIVITY'
  | 'OVERALL_INDEX';

export type RankingEventType =
  | 'MATCH_COMPLETED'
  | 'TOURNAMENT_WON'
  | 'COACHING_SESSION_ATTENDED'
  | 'COACH_FEEDBACK_SUBMITTED'
  | 'BOOKING_COMPLETED'
  | 'PLAYER_INACTIVITY_DETECTED'
  | 'PLAYER_INACTIVITY'
  | 'TOURNAMENT_REGISTERED';

export enum EventConfidenceLevel {
  UNVERIFIED = 'UNVERIFIED',
  VERIFIED = 'VERIFIED',
  HIGH_CONFIDENCE = 'HIGH_CONFIDENCE',
}

export enum AbuseType {
  SPAM_ACTIVITY = 'SPAM_ACTIVITY',
  SAME_OPPONENT_REPEAT = 'SAME_OPPONENT_REPEAT',
  UNVERIFIED_BOOKINGS = 'UNVERIFIED_BOOKINGS',
  COACHING_SESSION_SPAM = 'COACHING_SESSION_SPAM',
}

export type RankingEventPayload = {
  id: string;
  eventId: string;
  eventType: RankingEventType;
  organizationId: string;
  playerId: string;
  occurredAt: Date;
  formulaVersion: string;
  confidenceLevel: EventConfidenceLevel;
  sourceData: Record<string, any>;
  metadata: Record<string, any>;
  explanation?: string;
  verificationSources?: string[];
};

export interface CompetitiveRankSnapshot {
  id: string;
  organizationId: string;
  playerId: string;
  currentScore: number; // ELO-like rating
  previousScore: number | null;
  rank: number | null;
  previousRank: number | null;
  matchesWon: number;
  matchesLost: number;
  winRate: number; // 0-100
  tournamentWins: number;
  opponentStrengthAvg: number; // Average difficulty
  confidenceScore: number; // 0-100
  isProvisional: boolean;
  matchesConsidered: number;
  lastUpdated: Date;
  createdAt: Date;
}

export interface DevelopmentScoreSnapshot {
  id: string;
  organizationId: string;
  playerId: string;
  currentScore: number; // 0-100
  previousScore: number | null;
  coachingSessionsAttended: number;
  consistencyStreak: number;
  improvementTrend: number; // % improvement over period
  coachAssessmentScore: number; // 0-100 from coach ratings
  practiceParticipation: number; // 0-100
  lastUpdated: Date;
  createdAt: Date;
}

export interface ActivityScoreSnapshot {
  id: string;
  organizationId: string;
  playerId: string;
  currentScore: number; // 0-100
  previousScore: number | null;
  bookingsThisMonth: number;
  courtAppearances: number;
  matchesPlayed: number;
  recentParticipationFrequency: number; // 0-100
  consecutiveDaysActive: number;
  lastUpdated: Date;
  createdAt: Date;
}

export interface OverallIndexSnapshot {
  id: string;
  organizationId: string;
  playerId: string;
  indexScore: number; // 0-100
  previousIndexScore: number | null;
  competitiveWeight: number; // 0-1
  developmentWeight: number; // 0-1
  activityWeight: number; // 0-1
  trend: 'up' | 'down' | 'stable';
  movement: number; // Change from previous
  lastUpdated: Date;
  createdAt: Date;
}

export interface RankingHistory {
  id: string;
  organizationId: string;
  playerId: string;
  rankingType: RankingDimension;
  score: number;
  previousScore: number | null;
  movement: number; // Change in score
  reason: string; // Why it changed
  snapshot: Record<string, any>; // Full snapshot at this time
  recordedAt: Date;
  createdAt: Date;
}

export interface RankingEvent {
  id: string;
  organizationId: string;
  playerId: string;
  eventType: RankingEventType;
  eventId: string; // Reference to match/session/rating/etc
  impactedDimensions: RankingDimension[]; // Which rankings were affected
  scoreChange: number; // How much the score changed
  reason: string; // Human-readable explanation
  sourceData: Record<string, any>; // Original event data
  formulaVersion: string;
  confidenceLevel: EventConfidenceLevel;
  verificationSources?: string[];
  processedEventId?: string;
  explanation?: string;
  createdAt: Date;
}

export interface LeaderboardProjection {
  id: string;
  organizationId: string;
  leaderboardType: string; // "GLOBAL", "REGIONAL", "AGE_GROUP", "ORGANIZATION"
  playerId: string;
  rank: number;
  score: number;
  displayName: string;
  metadata: Record<string, any>; // Age, region, organization, etc
  lastProjectedAt: Date;
  createdAt: Date;
}

export interface RankingCalculatorInput {
  organizationId: string;
  playerId: string;
  period?: {
    startDate: Date;
    endDate: Date;
  };
}

export interface RankingCalculatorOutput {
  organizationId: string;
  playerId: string;
  currentScore: number;
  previousScore: number | null;
  movement: number;
  reason: string;
  metadata: Record<string, any>;
}

export interface RankingConfidence {
  confidenceScore: number; // 0-100
  isProvisional: boolean;
  matchesConsidered: number;
  minMatchesRequired: number;
  provisionalReason?: string;
  trustLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface CalculationFactor {
  name: string;
  weight: number;
  value: number;
  impact: number; // Positive or negative impact
  description: string;
}

export interface CalculationResult {
  score: number;
  previousScore?: number;
  movement: number;
  confidence: number; // 0-100
  factors: CalculationFactor[];
  explanation: string;
  metadata: Record<string, any>;
}

export interface ExplanationFactor {
  name?: string;
  description: string;
  contribution?: number; // Points contributed
  percentage?: number; // % of total change
  impact?: number;
  type?: string;
  weight?: number;
  evidence?: Record<string, any>;
}

export interface RankingExplanation {
  title?: string;
  description?: string;
  explanation?: string;
  pointsChange: number;
  dimension: RankingDimension;
  factors: ExplanationFactor[];
  playerId?: string;
  headline?: string;
  previousScore?: number;
  currentScore?: number;
  scoreDelta?: number;
  deltaPercentage?: number;
  periodDescription?: string;
  calculatedAt?: Date;
  isPositive: boolean;
  importance: number; // 1-10
  relatedEventId?: string;
}

export interface AntiAbuseViolation {
  type: AbuseType;
  severity: number; // 1-10
  diminishingFactor: number; // 0-1, how much to reduce score
  reason: string;
  metadata: Record<string, any>;
}

export interface AbuseCheckContext {
  organizationId: string;
  playerId: string;
  eventType: RankingEventType;
  eventData: Record<string, any>;
  recentEvents?: RankingEventPayload[];
}

export enum AbuseRiskLevel {
  SAFE = 'SAFE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AbuseFlag {
  type: string;
  severity: 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  evidence: Record<string, any>;
}

export interface AbuseAssessment {
  playerId: string;
  riskLevel: AbuseRiskLevel;
  sameOpponentScore: number;
  activitySpamScore: number;
  unverifiedMatchScore: number;
  systematicGamingScore: number;
  flags: AbuseFlag[];
  recommendations: string[];
  assessedAt: Date;
}

export interface FormulaDefinition {
  version: string;
  dimension?: RankingDimension;
  name: string;
  description: string;
  weights: Record<string, number>;
  parameters: Record<string, any>;
  minValue: number;
  maxValue: number;
  createdAt: Date;
  isActive: boolean;
  deprecatedAt?: Date;
}
