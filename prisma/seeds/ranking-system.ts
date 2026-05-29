/**
 * Seed: Ranking System with Event Traceability
 * 
 * This seed creates realistic ranking data that can be traced back to:
 * - Match results
 * - Coaching sessions
 * - Coach ratings
 * - Activity bookings
 */

import prisma from '@/lib/prisma';
import { createDomainEvent } from '@/core/events/DomainEvent';
import { publishEvent } from '@/core/events/EventBus';

interface RankingEventData {
  playerId: string;
  organizationId: string;
  eventType: string;
  sourceId: string; // match/session/rating id
  scoreChange: number;
  impactedDimensions: string[];
  sourceData: any;
}

/**
 * Create ranking events that can be traced back to their sources
 */
async function seedRankingEvents(
  organizationId: string,
  events: RankingEventData[]
): Promise<void> {
  for (const event of events) {
    // Store ranking event
    await prisma.rankingEvent.create({
      data: {
        id: `rank-evt-${event.sourceId}-${Date.now()}`,
        organizationId,
        playerId: event.playerId,
        eventType: event.eventType,
        eventId: event.sourceId,
        impactedDimensions: event.impactedDimensions,
        scoreChange: event.scoreChange,
        reason: `${event.eventType}: ${event.sourceData.description}`,
        sourceData: event.sourceData,
      },
    });

    // Publish domain event for ranking update
    const domainEvent = createDomainEvent(
      'RANKING_EVENT_OCCURRED',
      event.playerId,
      'Player',
      organizationId,
      {
        playerId: event.playerId,
        eventType: event.eventType,
        eventId: event.sourceId,
        impactedDimensions: event.impactedDimensions,
        scoreChange: event.scoreChange,
        sourceData: event.sourceData,
      }
    );

    await publishEvent(domainEvent);
  }
}

/**
 * Seed competitive rank from matches
 */
async function seedCompetitiveRankings(organizationId: string): Promise<void> {
  // Get all players and their match history
  const players = await prisma.player.findMany({
    where: { organizationId },
    include: {
      matchesA: { orderBy: { createdAt: 'desc' }, take: 10 },
      matchesB: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });

  const rankingEvents: RankingEventData[] = [];

  for (const player of players) {
    let currentScore = player.ratingPoints || 1500;
    const allMatches = [...player.matchesA, ...player.matchesB]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    for (const match of allMatches) {
      const didWin = match.winnerId === player.userId;
      const previousScore = currentScore;

      // Simple ELO calculation
      const kFactor = 32;
      const expectedScore = 1 / (1 + Math.pow(10, (player.ratingPoints - 1500) / 400));
      const actualScore = didWin ? 1 : 0;
      const scoreChange = Math.round(kFactor * (actualScore - expectedScore));
      currentScore = Math.max(1000, previousScore + scoreChange);

      rankingEvents.push({
        playerId: player.userId,
        organizationId,
        eventType: 'MATCH_COMPLETED',
        sourceId: match.id,
        scoreChange,
        impactedDimensions: ['COMPETITIVE'],
        sourceData: {
          description: `Match vs opponent: ${didWin ? 'WIN' : 'LOSS'}`,
          matchId: match.id,
          opponent: didWin ? 'TBD' : 'TBD',
          score: match.score,
          round: match.round,
        },
      });
    }
  }

  await seedRankingEvents(organizationId, rankingEvents);
}

/**
 * Seed development scores from coaching sessions
 */
async function seedDevelopmentScores(organizationId: string): Promise<void> {
  // Get all completed sessions
  const sessions = await prisma.coachSession.findMany({
    where: {
      organizationId,
      status: 'completed',
    },
    include: {
      player: true,
      coach: true,
      bookings: true,
      sessionRatings: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const rankingEvents: RankingEventData[] = [];

  for (const session of sessions) {
    if (!session.playerId) continue;

    // Get coach ratings for this session
    const coachRatings = session.sessionRatings
      .filter(r => r.sessionId === session.id)
      .map(r => r.overallRating);

    const avgRating = coachRatings.length > 0
      ? coachRatings.reduce((a, b) => a + b, 0) / coachRatings.length
      : 0;

    const scoreChange = Math.round((avgRating / 5) * 10); // Convert 0-5 to 0-10 points

    rankingEvents.push({
      playerId: session.playerId,
      organizationId,
      eventType: 'COACHING_SESSION_ATTENDED',
      sourceId: session.id,
      scoreChange,
      impactedDimensions: ['DEVELOPMENT', 'ACTIVITY'],
      sourceData: {
        description: `Coaching session completed: ${session.title}`,
        sessionId: session.id,
        coachId: session.coachId,
        coachName: session.coachId || 'Coach',
        duration: session.durationMinutes,
        coachRating: avgRating,
        participantCount: session.bookings.length,
      },
    });
  }

  await seedRankingEvents(organizationId, rankingEvents);
}

/**
 * Seed activity scores from bookings
 */
async function seedActivityScores(organizationId: string): Promise<void> {
  // Get recent court bookings
  const bookings = await prisma.courtBooking.findMany({
    where: {
      organizationId,
      status: 'confirmed',
    },
    include: {
      member: {
        include: {
          player: true,
        },
      },
      court: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const rankingEvents: RankingEventData[] = [];

  for (const booking of bookings) {
    if (!booking.memberId || !booking.member?.player) continue;

    rankingEvents.push({
      playerId: booking.member.player.userId,
      organizationId,
      eventType: 'BOOKING_COMPLETED',
      sourceId: booking.id,
      scoreChange: 5, // Base activity points
      impactedDimensions: ['ACTIVITY'],
      sourceData: {
        description: `Court booking: ${booking.court?.name}`,
        bookingId: booking.id,
        courtId: booking.courtId,
        courtName: booking.court?.name,
        date: booking.startTime,
        duration: Math.round(
          (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60)
        ),
      },
    });
  }

  await seedRankingEvents(organizationId, rankingEvents);
}

/**
 * Seed coach reputation scores
 */
async function seedCoachReputationScores(organizationId: string): Promise<void> {
  // Get all coaches with session ratings
  const coaches = await prisma.staff.findMany({
    where: {
      organizationId,
      role: 'coach',
    },
    include: {
      playerRatings: {
        where: { isConcluded: true },
      },
      sessions: {
        include: {
          bookings: true,
        },
      },
    },
  });

  for (const coach of coaches) {
    if (coach.playerRatings.length === 0) continue;

    const avgRating = coach.playerRatings.reduce((sum, r) => sum + r.overallRating, 0) 
      / coach.playerRatings.length;

    const score = Math.round((avgRating / 5) * 100); // Convert 0-5 to 0-100

    // Create coach reputation snapshot
    await prisma.coachReputationScoreSnapshot.upsert({
      where: {
        organizationId_coachId: {
          organizationId,
          coachId: coach.userId,
        },
      },
      create: {
        id: `coach-rep-${coach.userId}-${Date.now()}`,
        organizationId,
        coachId: coach.userId,
        currentScore: score,
        punctualityRating: avgRating,
        disciplineRating: avgRating,
        effortRating: avgRating,
        tacticalUnderstandingRating: avgRating,
        consistencyRating: avgRating,
        playerImprovementRate: 0.75, // 75% of players show improvement
      },
      update: {
        currentScore: score,
        punctualityRating: avgRating,
        disciplineRating: avgRating,
        effortRating: avgRating,
        tacticalUnderstandingRating: avgRating,
        consistencyRating: avgRating,
      },
    });
  }
}

/**
 * Create leaderboard projections
 */
async function seedLeaderboardProjections(organizationId: string): Promise<void> {
  // Get all competitive rank snapshots, ranked
  const snapshots = await prisma.competitiveRankSnapshot.findMany({
    where: { organizationId },
    orderBy: { currentScore: 'desc' },
  });

  for (let i = 0; i < snapshots.length; i++) {
    const snapshot = snapshots[i];

    // Get player info for display name
    const player = await prisma.player.findUnique({
      where: { userId: snapshot.playerId },
      include: { user: true },
    });

    if (!player) continue;

    const displayName = `${player.user.firstName} ${player.user.lastName}`;

    await prisma.leaderboardProjection.upsert({
      where: {
        organizationId_leaderboardType_playerId: {
          organizationId,
          leaderboardType: 'GLOBAL',
          playerId: snapshot.playerId,
        },
      },
      create: {
        id: `lb-${organizationId}-${snapshot.playerId}-${Date.now()}`,
        organizationId,
        leaderboardType: 'GLOBAL',
        playerId: snapshot.playerId,
        rank: i + 1,
        score: snapshot.currentScore,
        displayName,
        metadata: {
          wins: snapshot.matchesWon,
          losses: snapshot.matchesLost,
          winRate: snapshot.winRate,
        },
      },
      update: {
        rank: i + 1,
        score: snapshot.currentScore,
        lastProjectedAt: new Date(),
      },
    });
  }
}

/**
 * Main seeding function
 */
export async function seedRankingSystem(organizationId: string): Promise<void> {
  console.log('🏆 Seeding ranking system...');

  try {
    console.log('  ├─ Seeding competitive rankings from matches...');
    await seedCompetitiveRankings(organizationId);

    console.log('  ├─ Seeding development scores from coaching sessions...');
    await seedDevelopmentScores(organizationId);

    console.log('  ├─ Seeding activity scores from bookings...');
    await seedActivityScores(organizationId);

    console.log('  ├─ Seeding coach reputation scores...');
    await seedCoachReputationScores(organizationId);

    console.log('  └─ Creating leaderboard projections...');
    await seedLeaderboardProjections(organizationId);

    console.log('✅ Ranking system seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding ranking system:', error);
    throw error;
  }
}

export default seedRankingSystem;
