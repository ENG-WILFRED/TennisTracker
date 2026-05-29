/**
 * Leaderboard Projections
 * 
 * Maintains optimized, pre-computed leaderboard views
 * for fast querying and display
 */

import prisma from '@/lib/prisma';

export type LeaderboardType = 'GLOBAL' | 'REGIONAL' | 'AGE_GROUP' | 'ORGANIZATION';

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  changeFromLastWeek: number;
  wins?: number;
  losses?: number;
  winRate?: number;
}

/**
 * Compute global competitive leaderboard
 */
export async function computeGlobalLeaderboard(
  organizationId: string,
  limit: number = 100
): Promise<LeaderboardEntry[]> {
  const snapshots = await prisma.competitiveRankSnapshot.findMany({
    where: { organizationId },
    orderBy: { currentScore: 'desc' },
    take: limit,
    include: {
      player: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  return snapshots.map((snapshot, index) => {
    const trend = snapshot.previousScore
      ? snapshot.currentScore > snapshot.previousScore
        ? 'up'
        : snapshot.currentScore < snapshot.previousScore
        ? 'down'
        : 'stable'
      : 'stable';

    const changeFromPrevious = snapshot.previousScore
      ? snapshot.currentScore - snapshot.previousScore
      : 0;

    return {
      rank: index + 1,
      playerId: snapshot.playerId,
      displayName: `${snapshot.player.user.firstName} ${snapshot.player.user.lastName}`,
      score: snapshot.currentScore,
      trend,
      changeFromLastWeek: changeFromPrevious,
      wins: snapshot.matchesWon,
      losses: snapshot.matchesLost,
      winRate: snapshot.winRate,
    };
  });
}

/**
 * Compute development leaderboard
 */
export async function computeDevelopmentLeaderboard(
  organizationId: string,
  limit: number = 50
): Promise<LeaderboardEntry[]> {
  const snapshots = await prisma.developmentScoreSnapshot.findMany({
    where: { organizationId },
    orderBy: { currentScore: 'desc' },
    take: limit,
    include: {
      player: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  return snapshots.map((snapshot, index) => ({
    rank: index + 1,
    playerId: snapshot.playerId,
    displayName: `${snapshot.player.user.firstName} ${snapshot.player.user.lastName}`,
    score: snapshot.currentScore,
    trend: snapshot.improvementTrend > 0 ? 'up' : snapshot.improvementTrend < 0 ? 'down' : 'stable',
    changeFromLastWeek: snapshot.currentScore - (snapshot.previousScore || 0),
  }));
}

/**
 * Compute activity leaderboard
 */
export async function computeActivityLeaderboard(
  organizationId: string,
  limit: number = 50
): Promise<LeaderboardEntry[]> {
  const snapshots = await prisma.activityScoreSnapshot.findMany({
    where: { organizationId },
    orderBy: { currentScore: 'desc' },
    take: limit,
    include: {
      player: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  return snapshots.map((snapshot, index) => ({
    rank: index + 1,
    playerId: snapshot.playerId,
    displayName: `${snapshot.player.user.firstName} ${snapshot.player.user.lastName}`,
    score: snapshot.currentScore,
    trend:
      snapshot.recentParticipationFrequency > 75
        ? 'up'
        : snapshot.recentParticipationFrequency < 25
        ? 'down'
        : 'stable',
    changeFromLastWeek: snapshot.currentScore - (snapshot.previousScore || 0),
  }));
}

/**
 * Compute overall index leaderboard
 */
export async function computeOverallIndexLeaderboard(
  organizationId: string,
  limit: number = 100
): Promise<LeaderboardEntry[]> {
  const snapshots = await prisma.overallIndexSnapshot.findMany({
    where: { organizationId },
    orderBy: { indexScore: 'desc' },
    take: limit,
    include: {
      player: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  return snapshots.map((snapshot, index) => ({
    rank: index + 1,
    playerId: snapshot.playerId,
    displayName: `${snapshot.player.user.firstName} ${snapshot.player.user.lastName}`,
    score: snapshot.indexScore,
    trend: snapshot.trend as 'up' | 'down' | 'stable',
    changeFromLastWeek: snapshot.movement,
  }));
}

/**
 * Get player's rank across all leaderboards
 */
export async function getPlayerRanks(
  organizationId: string,
  playerId: string
): Promise<{
  competitive: number | null;
  development: number | null;
  activity: number | null;
  overallIndex: number | null;
}> {
  const [competitive, development, activity, overall] = await Promise.all([
    prisma.competitiveRankSnapshot
      .findMany({
        where: { organizationId },
        orderBy: { currentScore: 'desc' },
        select: { playerId: true },
      })
      .then(results => results.findIndex(r => r.playerId === playerId) + 1 || null),

    prisma.developmentScoreSnapshot
      .findMany({
        where: { organizationId },
        orderBy: { currentScore: 'desc' },
        select: { playerId: true },
      })
      .then(results => results.findIndex(r => r.playerId === playerId) + 1 || null),

    prisma.activityScoreSnapshot
      .findMany({
        where: { organizationId },
        orderBy: { currentScore: 'desc' },
        select: { playerId: true },
      })
      .then(results => results.findIndex(r => r.playerId === playerId) + 1 || null),

    prisma.overallIndexSnapshot
      .findMany({
        where: { organizationId },
        orderBy: { indexScore: 'desc' },
        select: { playerId: true },
      })
      .then(results => results.findIndex(r => r.playerId === playerId) + 1 || null),
  ]);

  return { competitive, development, activity, overallIndex: overall };
}

/**
 * Get detailed player ranking summary
 */
export async function getPlayerRankingSummary(
  organizationId: string,
  playerId: string
) {
  const [
    competitiveSnapshot,
    developmentSnapshot,
    activitySnapshot,
    coachSnapshot,
    overallSnapshot,
    ranks,
    recentEvents,
  ] = await Promise.all([
    prisma.competitiveRankSnapshot.findUnique({
      where: { organizationId_playerId: { organizationId, playerId } },
    }),
    prisma.developmentScoreSnapshot.findUnique({
      where: { organizationId_playerId: { organizationId, playerId } },
    }),
    prisma.activityScoreSnapshot.findUnique({
      where: { organizationId_playerId: { organizationId, playerId } },
    }),
    prisma.coachReputationScoreSnapshot.findFirst({
      where: { organizationId, coachId: playerId },
    }),
    prisma.overallIndexSnapshot.findUnique({
      where: { organizationId_playerId: { organizationId, playerId } },
    }),
    getPlayerRanks(organizationId, playerId),
    prisma.rankingEvent.findMany({
      where: { organizationId, playerId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  return {
    playerId,
    competitiveRank: {
      score: competitiveSnapshot?.currentScore,
      previousScore: competitiveSnapshot?.previousScore,
      rank: ranks.competitive,
      matchesWon: competitiveSnapshot?.matchesWon,
      matchesLost: competitiveSnapshot?.matchesLost,
      winRate: competitiveSnapshot?.winRate,
      lastUpdated: competitiveSnapshot?.lastUpdated,
    },
    developmentScore: {
      score: developmentSnapshot?.currentScore,
      previousScore: developmentSnapshot?.previousScore,
      rank: ranks.development,
      sessionsAttended: developmentSnapshot?.coachingSessionsAttended,
      improvementTrend: developmentSnapshot?.improvementTrend,
      lastUpdated: developmentSnapshot?.lastUpdated,
    },
    activityScore: {
      score: activitySnapshot?.currentScore,
      previousScore: activitySnapshot?.previousScore,
      rank: ranks.activity,
      bookingsThisMonth: activitySnapshot?.bookingsThisMonth,
      consecutiveDaysActive: activitySnapshot?.consecutiveDaysActive,
      lastUpdated: activitySnapshot?.lastUpdated,
    },
    coachReputation: coachSnapshot ? {
      score: coachSnapshot.currentScore,
      punctuality: coachSnapshot.punctualityRating,
      discipline: coachSnapshot.disciplineRating,
      effort: coachSnapshot.effortRating,
      tacticalUnderstanding: coachSnapshot.tacticalUnderstandingRating,
      consistency: coachSnapshot.consistencyRating,
      playerImprovementRate: coachSnapshot.playerImprovementRate,
      lastUpdated: coachSnapshot.lastUpdated,
    } : null,
    overallIndex: {
      score: overallSnapshot?.indexScore,
      previousScore: overallSnapshot?.previousIndexScore,
      rank: ranks.overallIndex,
      trend: overallSnapshot?.trend,
      movement: overallSnapshot?.movement,
      lastUpdated: overallSnapshot?.lastUpdated,
    },
    recentEvents: recentEvents.map(evt => ({
      id: evt.id,
      eventType: evt.eventType,
      impactedDimensions: evt.impactedDimensions,
      scoreChange: evt.scoreChange,
      reason: evt.reason,
      sourceEventId: evt.eventId,
      timestamp: evt.createdAt,
    })),
  };
}

/**
 * Refresh all leaderboard projections
 */
export async function refreshLeaderboardProjections(organizationId: string): Promise<void> {
  try {
    // Compute all leaderboards
    const [globalLb, developmentLb, activityLb, overallLb] = await Promise.all([
      computeGlobalLeaderboard(organizationId, 1000),
      computeDevelopmentLeaderboard(organizationId, 1000),
      computeActivityLeaderboard(organizationId, 1000),
      computeOverallIndexLeaderboard(organizationId, 1000),
    ]);

    // Update leaderboard projections
    const updatePromises = [
      ...globalLb.map(entry =>
        prisma.leaderboardProjection.upsert({
          where: {
            organizationId_leaderboardType_playerId: {
              organizationId,
              leaderboardType: 'GLOBAL',
              playerId: entry.playerId,
            },
          },
          create: {
            id: `lb-global-${entry.playerId}-${Date.now()}`,
            organizationId,
            leaderboardType: 'GLOBAL',
            playerId: entry.playerId,
            rank: entry.rank,
            score: entry.score,
            displayName: entry.displayName,
            metadata: {
              trend: entry.trend,
              wins: entry.wins,
              losses: entry.losses,
              winRate: entry.winRate,
            },
          },
          update: {
            rank: entry.rank,
            score: entry.score,
            metadata: {
              trend: entry.trend,
              wins: entry.wins,
              losses: entry.losses,
              winRate: entry.winRate,
              lastProjectedAt: new Date(),
            },
          },
        })
      ),
      ...developmentLb.map(entry =>
        prisma.leaderboardProjection.upsert({
          where: {
            organizationId_leaderboardType_playerId: {
              organizationId,
              leaderboardType: 'DEVELOPMENT',
              playerId: entry.playerId,
            },
          },
          create: {
            id: `lb-dev-${entry.playerId}-${Date.now()}`,
            organizationId,
            leaderboardType: 'DEVELOPMENT',
            playerId: entry.playerId,
            rank: entry.rank,
            score: entry.score,
            displayName: entry.displayName,
            metadata: { trend: entry.trend },
          },
          update: {
            rank: entry.rank,
            score: entry.score,
            metadata: { trend: entry.trend, lastProjectedAt: new Date() },
          },
        })
      ),
      ...activityLb.map(entry =>
        prisma.leaderboardProjection.upsert({
          where: {
            organizationId_leaderboardType_playerId: {
              organizationId,
              leaderboardType: 'ACTIVITY',
              playerId: entry.playerId,
            },
          },
          create: {
            id: `lb-activity-${entry.playerId}-${Date.now()}`,
            organizationId,
            leaderboardType: 'ACTIVITY',
            playerId: entry.playerId,
            rank: entry.rank,
            score: entry.score,
            displayName: entry.displayName,
            metadata: { trend: entry.trend },
          },
          update: {
            rank: entry.rank,
            score: entry.score,
            metadata: { trend: entry.trend, lastProjectedAt: new Date() },
          },
        })
      ),
      ...overallLb.map(entry =>
        prisma.leaderboardProjection.upsert({
          where: {
            organizationId_leaderboardType_playerId: {
              organizationId,
              leaderboardType: 'OVERALL',
              playerId: entry.playerId,
            },
          },
          create: {
            id: `lb-overall-${entry.playerId}-${Date.now()}`,
            organizationId,
            leaderboardType: 'OVERALL',
            playerId: entry.playerId,
            rank: entry.rank,
            score: entry.score,
            displayName: entry.displayName,
            metadata: { trend: entry.trend },
          },
          update: {
            rank: entry.rank,
            score: entry.score,
            metadata: { trend: entry.trend, lastProjectedAt: new Date() },
          },
        })
      ),
    ];

    await Promise.all(updatePromises);
    console.log(`✅ Leaderboard projections refreshed for organization ${organizationId}`);
  } catch (error) {
    console.error('Error refreshing leaderboard projections:', error);
    throw error;
  }
}

export default {
  computeGlobalLeaderboard,
  computeDevelopmentLeaderboard,
  computeActivityLeaderboard,
  computeOverallIndexLeaderboard,
  getPlayerRanks,
  getPlayerRankingSummary,
  refreshLeaderboardProjections,
};
