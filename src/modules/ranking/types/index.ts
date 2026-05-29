/**
 * Comprehensive Ranking System Types
 * Foundation for the entire ranking engine
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum RankingDimension {
  COMPETITIVE = 'COMPETITIVE',
  DEVELOPMENT = 'DEVELOPMENT',
  ACTIVITY = 'ACTIVITY',
  OVERALL_INDEX = 'OVERALL_INDEX',
}

export enum RankingEventType {
  // Competitive Rank events
  MATCH_COMPLETED = 'MATCH_COMPLETED',
  TOURNAMENT_WON = 'TOURNAMENT_WON',
  TOURNAMENT_PARTICIPATED = 'TOURNAMENT_PARTICIPATED',

  // Development Score events
  COACHING_SESSION_ATTENDED = 'COACHING_SESSION_ATTENDED',
  COACH_FEEDBACK_SUBMITTED = 'COACH_FEEDBACK_SUBMITTED',

  // Activity Score events
  BOOKING_COMPLETED = 'BOOKING_COMPLETED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  MATCH_ATTENDED = 'MATCH_ATTENDED',

  // System events
  PLAYER_INACTIVITY_DETECTED = 'PLAYER_INACTIVITY_DETECTED',
  RANKING_RECALCULATION_TRIGGERED = 'RANKING_RECALCULATION_TRIGGERED',
}

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

// ============================================================================
// RANKING EVENT TYPES
// ============================================================================

export interface RankingEventPayload {
  id: string;
  eventId: string;
  eventType: RankingEventType;
  organizationId: string;
  playerId: string;
  affectedPlayerIds?: string[];
  occurredAt: Date;
  formulaVersion: string;
  confidenceLevel: EventConfidenceLevel;
  sourceData: Record<string, any>;
  metadata: Record<string, any>;
  explanation?: string;
  verificationSources?: string[];
}

// ============================================================================
// SNAPSHOT TYPES
// ============================================================================

export interface CompetitiveRankSnapshotData {
  currentScore: number;
  previousScore?: number;
  rank?: number;
  previousRank?: number;
  matchesWon: number;
  matchesLost: number;
  winRate: number;
  tournamentWins: number;
  opponentStrengthAvg: number;
  confidenceScore: number;
  isProvisional: boolean;
  matchesConsidered: number;
}

export interface DevelopmentScoreSnapshotData {
  currentScore: number;
  previousScore?: number;
  coachingSessionsAttended: number;
  consistencyStreak: number;
  improvementTrend: number;
  coachAssessmentScore: number;
  practiceParticipation: number;
}

export interface ActivityScoreSnapshotData {
  currentScore: number;
  previousScore?: number;
  bookingsThisMonth: number;
  courtAppearances: number;
  matchesPlayed: number;
  recentParticipationFrequency: number;
  consecutiveDaysActive: number;
}

export interface OverallIndexSnapshotData {
  indexScore: number;
  previousIndexScore?: number;
  competitiveWeight: number;
  developmentWeight: number;
  activityWeight: number;
  trend: 'up' | 'down' | 'stable';
  movement: number;
}

// ============================================================================
// CALCULATOR RESULTS
// ============================================================================

export interface CalculationResult {
  score: number;
  previousScore?: number;
  movement: number; // score - previousScore
  confidence: number; // 0-100
  factors: CalculationFactor[];
  explanation: string;
  metadata: Record<string, any>;
}

export interface CalculationFactor {
  name: string;
  weight: number;
  value: number;
  impact: number; // Positive or negative impact
  description: string;
}

// ============================================================================
// CONFIDENCE & PROVISIONAL RANKINGS
// ============================================================================

export interface RankingConfidence {
  confidenceScore: number; // 0-100
  isProvisional: boolean; // True if under threshold
  matchesConsidered: number;
  minMatchesRequired: number;
  provisionalReason?: string;
  trustLevel: 'LOW' | 'MEDIUM' | 'HIGH'; // Based on confidence score
}

// ============================================================================
// ANTI-ABUSE TYPES
// ============================================================================

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

// ============================================================================
// EXPLANATION TYPES
// ============================================================================

export interface RankingExplanation {
  title: string;
  description: string;
  pointsChange: number;
  dimension: RankingDimension;
  factors: ExplanationFactor[];
  isPositive: boolean;
  importance: number; // 1-10
  relatedEventId?: string;
}

export interface ExplanationFactor {
  name: string;
  description: string;
  contribution: number; // Points contributed
  percentage: number; // % of total change
}

// ============================================================================
// FORMULA VERSIONING
// ============================================================================

export interface FormulaDefinition {
  version: string;
  dimension: RankingDimension;
  name: string;
  description: string;
  weights: Record<string, number>;
  parameters: Record<string, any>;
  minValue: number;
  maxValue: number;
  createdAt: Date;
  deprecatedAt?: Date;
  isActive: boolean;
}

export interface FormulaCalculationContext {
  playerId: string;
  organizationId: string;
  dimension: RankingDimension;
  formulaVersion: string;
  rawMetrics: Record<string, number>;
  previousScore?: number;
}

// ============================================================================
// CACHE TYPES
// ============================================================================

export interface CacheEntry<T> {
  key: string;
  value: T;
  expiresAt: Date;
  createdAt: Date;
  ttlSeconds: number;
}

export interface CacheConfig {
  leaderboardTTL: number; // seconds
  playerProfileTTL: number;
  explanationTTL: number;
  redisUrl?: string;
}

// ============================================================================
// LEADERBOARD TYPES
// ============================================================================

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  score: number;
  previousRank?: number;
  trend?: 'UP' | 'DOWN' | 'STABLE';
  metadata?: Record<string, any>;
}

export interface LeaderboardProjectionData {
  organizationId: string;
  leaderboardType: string;
  playerId: string;
  rank: number;
  score: number;
  displayName: string;
  metadata?: Record<string, any>;
  lastProjectedAt: Date;
}

// ============================================================================
// CALCULATION ENGINE TYPES
// ============================================================================

export interface ReplayContext {
  organizationId: string;
  playerId?: string; // If omitted, replay all players
  fromFormulaVersion: string;
  toFormulaVersion: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface ReplayResult {
  playerId: string;
  dimension: RankingDimension;
  oldScore: number;
  newScore: number;
  scoreDifference: number;
  formulaVersionChange: string;
}

// ============================================================================
// WORKER JOB TYPES
// ============================================================================

export interface RankingJobPayload {
  jobId: string;
  type: 'CALCULATE_RANKING' | 'REPLAY_RANKINGS' | 'UPDATE_LEADERBOARD' | 'CLEANUP';
  organizationId: string;
  playerId?: string;
  data: Record<string, any>;
  priority: number; // 1-10
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  processingStartedAt?: Date;
}

export interface JobResult {
  jobId: string;
  status: 'SUCCESS' | 'FAILED' | 'RETRY';
  message: string;
  data?: Record<string, any>;
  errorDetails?: string;
  completedAt: Date;
}

// ============================================================================
// CALCULATION CONTEXT
// ============================================================================

export interface CalculationContext {
  organizationId: string;
  playerId: string;
  dimension: RankingDimension;
  formulaVersion: string;
  asOfDate?: Date; // For historical calculations
}

// ============================================================================
// EVENT PROCESSOR TYPES
// ============================================================================

export interface ProcessEventResult {
  eventId: string;
  processed: boolean;
  snapshotsUpdated: RankingDimension[];
  calculationDetails: Record<string, any>;
  cacheInvalidated: boolean;
  explanationGenerated?: RankingExplanation;
  abuseViolations?: AntiAbuseViolation[];
}
