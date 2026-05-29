import { PrismaClient } from '../../src/generated/prisma/index.js';

const prisma = new PrismaClient();

/**
 * Seed ranking events based on existing matches
 * This creates realistic ranking impact data for all matches
 */
export async function seedRankingEventsFromMatches(): Promise<number> {
  console.log('🏆 Seeding ranking events from matches...');

  // Get all matches with their players
  const matches = await prisma.match.findMany({
    include: {
      playerA: { select: { userId: true, organizationId: true } },
      playerB: { select: { userId: true, organizationId: true } },
    },
  });

  console.log(`  📍 Processing ${matches.length} total matches`);

  let rankingEventsCreated = 0;

  for (const match of matches) {
    if (!match.playerA || !match.playerB) continue;

    const orgId = match.playerA.organizationId || match.playerB.organizationId;
    if (!orgId) continue;

    // Check if we already have ranking events for this match
    const existingEvents = await prisma.rankingEvent.findMany({
      where: { eventId: match.id },
    });

    if (existingEvents.length > 0) {
      console.log(`    ⏭️  Skipping match ${match.id} (already has ranking events)`);
      continue;
    }

    // Event for player A
    if (match.winnerId === match.playerA.userId) {
      // Player A won
      await prisma.rankingEvent.create({
        data: {
          organizationId: orgId,
          playerId: match.playerA.userId,
          eventType: 'MATCH_COMPLETED',
          eventId: match.id,
          impactedDimensions: ['COMPETITIVE_RANK'],
          scoreChange: 25,
          reason: `Won match against ${match.playerB.userId}`,
          sourceData: {
            description: `Match win: ${match.playerA.userId} defeated ${match.playerB.userId}`,
            matchId: match.id,
            score: match.score,
          },
        },
      });

      await prisma.rankingEvent.create({
        data: {
          organizationId: orgId,
          playerId: match.playerB.userId,
          eventType: 'MATCH_COMPLETED',
          eventId: match.id,
          impactedDimensions: ['COMPETITIVE_RANK'],
          scoreChange: -10,
          reason: `Lost match against ${match.playerA.userId}`,
          sourceData: {
            description: `Match loss: ${match.playerB.userId} lost to ${match.playerA.userId}`,
            matchId: match.id,
            score: match.score,
          },
        },
      });
    } else if (match.winnerId === match.playerB.userId) {
      // Player B won
      await prisma.rankingEvent.create({
        data: {
          organizationId: orgId,
          playerId: match.playerB.userId,
          eventType: 'MATCH_COMPLETED',
          eventId: match.id,
          impactedDimensions: ['COMPETITIVE_RANK'],
          scoreChange: 25,
          reason: `Won match against ${match.playerA.userId}`,
          sourceData: {
            description: `Match win: ${match.playerB.userId} defeated ${match.playerA.userId}`,
            matchId: match.id,
            score: match.score,
          },
        },
      });

      await prisma.rankingEvent.create({
        data: {
          organizationId: orgId,
          playerId: match.playerA.userId,
          eventType: 'MATCH_COMPLETED',
          eventId: match.id,
          impactedDimensions: ['COMPETITIVE_RANK'],
          scoreChange: -10,
          reason: `Lost match against ${match.playerB.userId}`,
          sourceData: {
            description: `Match loss: ${match.playerA.userId} lost to ${match.playerB.userId}`,
            matchId: match.id,
            score: match.score,
          },
        },
      });
    } else {
      // Match has no winner yet (draw or incomplete), create neutral events
      await prisma.rankingEvent.create({
        data: {
          organizationId: orgId,
          playerId: match.playerA.userId,
          eventType: 'MATCH_COMPLETED',
          eventId: match.id,
          impactedDimensions: ['ACTIVITY_SCORE'],
          scoreChange: 5,
          reason: `Participated in match against ${match.playerB.userId}`,
          sourceData: {
            description: `Match participation: played against ${match.playerB.userId}`,
            matchId: match.id,
            score: match.score,
          },
        },
      });

      await prisma.rankingEvent.create({
        data: {
          organizationId: orgId,
          playerId: match.playerB.userId,
          eventType: 'MATCH_COMPLETED',
          eventId: match.id,
          impactedDimensions: ['ACTIVITY_SCORE'],
          scoreChange: 5,
          reason: `Participated in match against ${match.playerA.userId}`,
          sourceData: {
            description: `Match participation: played against ${match.playerA.userId}`,
            matchId: match.id,
            score: match.score,
          },
        },
      });
    }

    rankingEventsCreated += 2;
    console.log(`    ✓ Created ranking events for match ${match.id}`);
  }

  console.log(`✅ Created ${rankingEventsCreated} ranking events from matches`);
  return rankingEventsCreated;
}

/**
 * Seed activity-based ranking events (coaching sessions, court bookings)
 */
export async function seedActivityRankingEvents(): Promise<number> {
  console.log('📊 Seeding activity ranking events...');

  // Get all completed coach sessions
  const sessions = await prisma.coachSession.findMany({
    where: { status: 'completed' },
    include: {
      bookings: {
        include: {
          player: { select: { userId: true } },
        },
      },
      player: { select: { userId: true } },
    },
    take: 20, // Limit for performance
  });

  console.log(`  📍 Processing ${sessions.length} completed coaching sessions`);

  let eventsCreated = 0;

  for (const session of sessions) {
    if (!session.organizationId) continue;

    // Check for existing activity events for this session
    const existingEvents = await prisma.rankingEvent.findMany({
      where: { eventId: session.id },
    });

    if (existingEvents.length > 0) {
      console.log(`    ⏭️  Skipping session ${session.id} (already has ranking events)`);
      continue;
    }

    // Create events for single player sessions
    if (session.playerId && session.player?.userId) {
      await prisma.rankingEvent.create({
        data: {
          organizationId: session.organizationId,
          playerId: session.player.userId,
          eventType: 'COACHING_SESSION_COMPLETED',
          eventId: session.id,
          impactedDimensions: ['DEVELOPMENT_SCORE', 'ACTIVITY_SCORE'],
          scoreChange: 8,
          reason: `Attended coaching session: ${session.title}`,
          sourceData: {
            description: `Development improvement from coaching session`,
            sessionId: session.id,
            sessionType: session.sessionType,
            title: session.title,
          },
        },
      });
      eventsCreated++;
    }

    // Create events for group session participants
    for (const booking of session.bookings) {
      if (booking.player?.userId) {
        await prisma.rankingEvent.create({
          data: {
            organizationId: session.organizationId,
            playerId: booking.player.userId,
            eventType: 'COACHING_SESSION_COMPLETED',
            eventId: session.id,
            impactedDimensions: ['DEVELOPMENT_SCORE', 'ACTIVITY_SCORE'],
            scoreChange: 6,
            reason: `Participated in group coaching: ${session.title}`,
            sourceData: {
              description: `Development from group coaching session`,
              sessionId: session.id,
              sessionType: session.sessionType,
              title: session.title,
            },
          },
        });
        eventsCreated++;
      }
    }

    if ((session.bookings.length > 0 || session.player) && eventsCreated > 0) {
      console.log(`    ✓ Created activity events for session ${session.id}`);
    }
  }

  console.log(`✅ Created ${eventsCreated} activity ranking events`);
  return eventsCreated;
}

/**
 * Main seed function
 */
async function main() {
  try {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🌱 RANKING EVENTS SEEDING');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const matchEvents = await seedRankingEventsFromMatches();
    const activityEvents = await seedActivityRankingEvents();

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✨ RANKING EVENTS SEEDING COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📊 Total ranking events created: ${matchEvents + activityEvents}`);
    console.log('═══════════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Error seeding ranking events:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
