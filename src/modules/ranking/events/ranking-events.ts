/**
 * Ranking Event Types & Definitions
 * 
 * Core event system for the ranking engine.
 * All ranking-impacting events flow through this system.
 */

/**
 * All event types that can impact rankings
 */
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

/**
 * Ranking dimensions that can be impacted
 */
export enum RankingDimension {
  COMPETITIVE = 'COMPETITIVE',
  DEVELOPMENT = 'DEVELOPMENT',
  ACTIVITY = 'ACTIVITY',
  OVERALL_INDEX = 'OVERALL_INDEX',
}

/**
 * Event confidence levels for anti-abuse
 */
export enum EventConfidenceLevel {
  UNVERIFIED = 'UNVERIFIED',      // User-submitted, needs verification
  VERIFIED = 'VERIFIED',          // Tournament/system verified
  HIGH_CONFIDENCE = 'HIGH_CONFIDENCE',  // Multiple verification sources
}

/**
 * Base ranking event interface
 * All events follow this structure
 */
export interface BaseRankingEvent {
  // Identity
  id: string;
  eventId: string;                    // Reference to source (matchId, sessionId, etc)
  eventType: RankingEventType;
  
  // Context
  organizationId: string;
  playerId: string;
  affectedPlayerIds?: string[];       // Multiple players affected (e.g., opponent)
  
  // Temporal
  occurredAt: Date;
  processedAt?: Date;
  
  // Data
  sourceData: Record<string, any>;    // Original event data
  metadata: Record<string, any>;      // Additional context
  
  // Formula tracking
  formulaVersion: string;             // v1, v2, etc - for replay capability
  
  // Anti-abuse
  confidenceLevel: EventConfidenceLevel;
  verificationSources?: string[];     // Where verification came from
  
  // Idempotency
  processedEventId?: string;          // Prevent duplicate processing
  
  // Explanation
  explanation?: string;               // Why this event matters
}

/**
 * Match completion event
 */
export interface MatchCompletedEvent extends BaseRankingEvent {
  eventType: RankingEventType.MATCH_COMPLETED;
  sourceData: {
    matchId: string;
    winnerId: string;
    loserId: string;
    winnerRating: number;
    loserRating: number;
    winnerStrength: number;           // Opponent difficulty
    loserStrength: number;
    setScores: string;                // e.g. "6-4 7-5"
    tournamentId?: string;
    verifiedByReferee?: boolean;
  };
}

/**
 * Tournament won event
 */
export interface TournamentWonEvent extends BaseRankingEvent {
  eventType: RankingEventType.TOURNAMENT_WON;
  sourceData: {
    tournamentId: string;
    tournamentName: string;
    tier: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PROFESSIONAL';
    participantCount: number;
    prizeAmount?: number;
    finalOpponents: Array<{
      playerId: string;
      rating: number;
    }>;
  };
}

/**
 * Coaching session attended event
 */
export interface CoachingSessionAttendedEvent extends BaseRankingEvent {
  eventType: RankingEventType.COACHING_SESSION_ATTENDED;
  sourceData: {
    sessionId: string;
    coachId: string;
    durationMinutes: number;
    sessionType: string;
    attendanceConfirmed: boolean;
    coachApprovedAt?: Date;
  };
}

/**
 * Coach feedback submitted event
 */
export interface CoachFeedbackSubmittedEvent extends BaseRankingEvent {
  eventType: RankingEventType.COACH_FEEDBACK_SUBMITTED;
  sourceData: {
    coachId: string;
    feedbackId: string;
    rating: number;               // 1-5
    techniqueRating?: number;
    mentalRating?: number;
    fitnessRating?: number;
    coachAssessmentScore: number; // 0-100
    improvementObserved: boolean;
    feedbackText?: string;
  };
}

/**
 * Booking completed event
 */
export interface BookingCompletedEvent extends BaseRankingEvent {
  eventType: RankingEventType.BOOKING_COMPLETED;
  sourceData: {
    bookingId: string;
    bookingType: string;         // 'court', 'coaching', 'tournament'
    courtId?: string;
    startTime: Date;
    endTime: Date;
    attended: boolean;
  };
}

/**
 * Player inactivity detected event
 */
export interface PlayerInactivityDetectedEvent extends BaseRankingEvent {
  eventType: RankingEventType.PLAYER_INACTIVITY_DETECTED;
  sourceData: {
    daysSinceLastMatch: number;
    daysSinceLastActivity: number;
    previousActivityLevel: string;
    decayPercentage: number;      // How much to decay the rating
  };
}

/**
 * Union type of all ranking events
 */
export type RankingEvent =
  | MatchCompletedEvent
  | TournamentWonEvent
  | CoachingSessionAttendedEvent
  | CoachFeedbackSubmittedEvent
  | BookingCompletedEvent
  | PlayerInactivityDetectedEvent;

/**
 * Result of processing a ranking event
 */
export interface RankingEventProcessResult {
  eventId: string;
  success: boolean;
  error?: string;
  
  // What changed
  dimensionsAffected: RankingDimension[];
  scoreChanges: Record<RankingDimension, number>;
  
  // Audit trail
  processedAt: Date;
  processingDurationMs: number;
  snapshots: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
}

/**
 * Ranking event that failed to process
 */
export interface FailedRankingEvent {
  eventId: string;
  error: string;
  attemptedAt: Date;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: Date;
}
