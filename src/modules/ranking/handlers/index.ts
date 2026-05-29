/**
 * Ranking Event Handlers
 * 
 * Listens to domain events and triggers ranking calculations
 * Each handler updates the appropriate ranking dimension and stores history
 */

import prisma from '@/lib/prisma';
import { RankingEventType } from '../events/ranking-events';
import {
  updateCompetitiveRankSnapshot,
  calculateDevelopmentScore,
  updateDevelopmentScoreSnapshot,
  calculateActivityScore,
  updateActivityScoreSnapshot,
} from '../calculators';
import { formulaManager } from '../formulas/formula-versioning';
import { EventConfidenceLevel } from '../types';

/**
 * Handle match completion events
 * Updates competitive rank based on win/loss
 */
export async function handleMatchCompleted(event: any): Promise<void> {
  const { matchId, playerId, organizationId, won } = event;

  try {
    // Get the match for context
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        playerA: { select: { user: { select: { firstName: true, lastName: true } } } },
        playerB: { select: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    if (!match) {
      console.warn(`Match ${matchId} not found for ranking calculation`);
      return;
    }

    // Update competitive rank
    await updateCompetitiveRankSnapshot({
      organizationId,
      playerId,
    });

    // Record ranking event for traceability
    const player = await prisma.player.findUnique({
      where: { userId: playerId },
      select: { ratingPoints: true },
    });

    const opponentName = match.playerAId === playerId
      ? `${match.playerB.user.firstName} ${match.playerB.user.lastName}`
      : `${match.playerA.user.firstName} ${match.playerA.user.lastName}`;

    await prisma.rankingEvent.create({
      data: {
        id: `rank-evt-match-${matchId}-${Date.now()}`,
        organizationId,
        playerId,
        eventType: RankingEventType.MATCH_COMPLETED,
        eventId: matchId,
        impactedDimensions: ['COMPETITIVE'],
        scoreChange: won ? 25 : -10, // preliminary event delta for traceability
        reason: `Match ${won ? 'WIN' : 'LOSS'} against ${opponentName}`,
        sourceData: {
          matchId,
          opponent: opponentName,
          score: match.score,
          round: match.round,
          timestamp: match.createdAt,
          verifiedByReferee: !!match.refereeId,
        },
        formulaVersion: formulaManager.getActiveFormula().version,
        confidenceLevel: won ? EventConfidenceLevel.VERIFIED : EventConfidenceLevel.VERIFIED,
      } as any,
    });

    console.log(`✅ Ranking updated for player ${playerId} after match ${matchId}`);
  } catch (error) {
    console.error(`Error handling match completed event:`, error);
    throw error;
  }
}

/**
 * Handle coaching session completion
 * Updates development and activity scores
 */
export async function handleSessionCompleted(event: any): Promise<void> {
  const { sessionId, playerId, organizationId, coachId } = event;

  try {
    const session = await prisma.coachSession.findUnique({
      where: { id: sessionId },
      include: {
        coach: { select: { user: { select: { firstName: true, lastName: true } } } },
        sessionRatings: true,
      },
    });

    if (!session || !session.playerId) {
      console.warn(`Session ${sessionId} not found or has no player`);
      return;
    }

    // Get average coach rating
    const avgRating = session.sessionRatings.length > 0
      ? session.sessionRatings.reduce((sum, r) => sum + r.overallRating, 0) / session.sessionRatings.length
      : 0;

    const coachName = session.coach?.user
      ? `${session.coach.user.firstName} ${session.coach.user.lastName}`
      : 'Coach';

    const formula = formulaManager.getActiveFormula();

    // Update development snapshot immediately from this session event
    const developmentResult = await calculateDevelopmentScore(playerId, organizationId, formula);
    await updateDevelopmentScoreSnapshot(
      playerId,
      organizationId,
      developmentResult.currentScore,
      developmentResult.previousScore
    );

    const activityResult = await calculateActivityScore(playerId, organizationId, formula);
    await updateActivityScoreSnapshot(
      playerId,
      organizationId,
      activityResult.currentScore,
      activityResult.previousScore
    );

    // Record ranking event
    await prisma.rankingEvent.create({
      data: {
        id: `rank-evt-session-${sessionId}-${Date.now()}`,
        organizationId,
        playerId,
        eventType: RankingEventType.COACHING_SESSION_ATTENDED,
        eventId: sessionId,
        impactedDimensions: ['DEVELOPMENT', 'ACTIVITY'],
        scoreChange: Math.round((avgRating / 5) * 10),
        reason: `Coaching session with ${coachName}, rating: ${avgRating.toFixed(1)}/5`,
        sourceData: {
          sessionId,
          coachId,
          coachName,
          duration: session.durationMinutes,
          coachRating: avgRating,
          timestamp: session.createdAt,
        },
        formulaVersion: formula.version,
        confidenceLevel: EventConfidenceLevel.HIGH_CONFIDENCE,
      } as any,
    });

    console.log(`✅ Ranking updated for player ${playerId} after session ${sessionId}`);
  } catch (error) {
    console.error(`Error handling session completed event:`, error);
    throw error;
  }
}

/**
 * Handle court booking completion
 * Updates activity score
 */
export async function handleBookingCompleted(event: any): Promise<void> {
  const { bookingId, memberId, organizationId } = event;

  try {
    const booking = await prisma.courtBooking.findUnique({
      where: { id: bookingId },
      include: {
        court: true,
        member: {
          include: {
            player: true,
          },
        },
      },
    });

    if (!booking || !booking.member?.player) {
      console.warn(`Booking ${bookingId} not found or member has no player`);
      return;
    }

    const playerId = booking.member.player.userId;
    const durationMinutes = Math.round(
      (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60)
    );

    const formula = formulaManager.getActiveFormula();

    const activityResult = await calculateActivityScore(playerId, organizationId, formula);
    await updateActivityScoreSnapshot(
      playerId,
      organizationId,
      activityResult.currentScore,
      activityResult.previousScore
    );

    // Record ranking event
    await prisma.rankingEvent.create({
      data: {
        id: `rank-evt-booking-${bookingId}-${Date.now()}`,
        organizationId,
        playerId,
        eventType: RankingEventType.BOOKING_COMPLETED,
        eventId: bookingId,
        impactedDimensions: ['ACTIVITY'],
        scoreChange: 5,
        reason: `Court booking: ${booking.court?.name}, ${durationMinutes} minutes`,
        sourceData: {
          bookingId,
          courtId: booking.courtId,
          courtName: booking.court?.name,
          duration: durationMinutes,
          date: booking.startTime,
        },
        formulaVersion: formula.version,
        confidenceLevel: EventConfidenceLevel.VERIFIED,
      } as any,
    });

    console.log(`✅ Activity score updated for player ${playerId} after booking ${bookingId}`);
  } catch (error) {
    console.error(`Error handling booking completed event:`, error);
    throw error;
  }
}

/**
 * Handle coach rating submission
 * Updates coach reputation and development score
 */
export async function handleCoachFeedbackSubmitted(event: any): Promise<void> {
  const { ratingId, playerId, coachId, organizationId, rating } = event;

  try {
    const coachRating = await prisma.coachPlayerRating.findUnique({
      where: { id: ratingId },
      include: {
        coach: { select: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    if (!coachRating) {
      console.warn(`Coach rating ${ratingId} not found`);
      return;
    }

    const coachName = coachRating.coach?.user
      ? `${coachRating.coach.user.firstName} ${coachRating.coach.user.lastName}`
      : 'Coach';

    const formula = formulaManager.getActiveFormula();
    const developmentResult = await calculateDevelopmentScore(playerId, organizationId, formula);
    await updateDevelopmentScoreSnapshot(
      playerId,
      organizationId,
      developmentResult.currentScore,
      developmentResult.previousScore
    );

    // Record ranking event - affects development only
    await prisma.rankingEvent.create({
      data: {
        id: `rank-evt-feedback-${ratingId}-${Date.now()}`,
        organizationId,
        playerId,
        eventType: RankingEventType.COACH_FEEDBACK_SUBMITTED,
        eventId: ratingId,
        impactedDimensions: ['DEVELOPMENT'],
        scoreChange: Math.round((coachRating.overallRating / 5) * 10),
        reason: `Coach feedback from ${coachName}: ${coachRating.overallRating}/5 stars`,
        sourceData: {
          ratingId,
          coachId,
          coachName,
          overallRating: coachRating.overallRating,
          techniqueRating: coachRating.techniquRating,
          mentalRating: coachRating.mentalRating,
          fitnessRating: coachRating.fitnessRating,
          teamworkRating: coachRating.teamworkRating,
          timestamp: coachRating.createdAt,
        },
        formulaVersion: formula.version,
        confidenceLevel: EventConfidenceLevel.HIGH_CONFIDENCE,
      } as any,
    });

    console.log(`✅ Development score updated for player ${playerId} after coach feedback`);
  } catch (error) {
    console.error(`Error handling coach feedback event:`, error);
    throw error;
  }
}

/**
 * Handle player inactivity
 * Applies time decay to ranking scores
 */
export async function handlePlayerInactivity(event: any): Promise<void> {
  const { playerId, organizationId, daysSinceActivity } = event;

  try {
    // Get current competitive snapshot
    const snapshot = await prisma.competitiveRankSnapshot.findUnique({
      where: {
        organizationId_playerId: { organizationId, playerId },
      },
    });

    if (!snapshot) {
      console.warn(`No ranking snapshot found for player ${playerId}`);
      return;
    }

    // Apply decay: 2% per week of inactivity
    const weeks = Math.floor(daysSinceActivity / 7);
    const decayFactor = Math.min(weeks * 0.02, 0.20); // Max 20% decay
    const decayAmount = Math.round(snapshot.currentScore * decayFactor);

    await updateCompetitiveRankSnapshot({ organizationId, playerId });

    // Record inactivity event
    await prisma.rankingEvent.create({
      data: {
        id: `rank-evt-inactivity-${playerId}-${Date.now()}`,
        organizationId,
        playerId,
        eventType: RankingEventType.PLAYER_INACTIVITY_DETECTED,
        eventId: `inactivity-${playerId}`,
        impactedDimensions: ['COMPETITIVE', 'ACTIVITY'],
        scoreChange: -decayAmount,
        reason: `Inactivity decay: ${daysSinceActivity} days without activity`,
        sourceData: {
          daysSinceActivity,
          weeks,
          decayFactor: (decayFactor * 100).toFixed(1),
          decayAmount,
        },
        formulaVersion: formulaManager.getActiveFormula().version,
        confidenceLevel: EventConfidenceLevel.VERIFIED,
      } as any,
    });

    console.log(`✅ Inactivity decay applied to player ${playerId}: -${decayAmount} points`);
  } catch (error) {
    console.error(`Error handling inactivity event:`, error);
    throw error;
  }
}

/**
 * Register all ranking event handlers with EventBus
 */
export async function registerRankingHandlers(eventBus: any): Promise<void> {
  try {
    eventBus.subscribe('MATCH_COMPLETED', handleMatchCompleted);
    eventBus.subscribe('SESSION_COMPLETED', handleSessionCompleted);
    eventBus.subscribe('BOOKING_COMPLETED', handleBookingCompleted);
    eventBus.subscribe('COACH_FEEDBACK_SUBMITTED', handleCoachFeedbackSubmitted);
    eventBus.subscribe('PLAYER_INACTIVITY', handlePlayerInactivity);
    eventBus.subscribe('PLAYER_INACTIVITY_DETECTED', handlePlayerInactivity);
    
    console.log('✅ Ranking event handlers registered');
  } catch (error) {
    console.error('Error registering ranking handlers:', error);
    throw error;
  }
}

export default {
  handleMatchCompleted,
  handleSessionCompleted,
  handleBookingCompleted,
  handleCoachFeedbackSubmitted,
  handlePlayerInactivity,
  registerRankingHandlers,
};
