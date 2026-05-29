/**
 * Leaderboard Projections
 * 
 * Pre-computed optimized leaderboard views.
 * Avoids expensive ranking calculation queries.
 * 
 * A projection is a read-optimized copy of ranked players.
 */

import prisma from '@/lib/prisma';

export type LeaderboardType = 'GLOBAL' | 'REGIONAL' | 'AGE_GROUP' | 'SKILL_LEVEL';

/**
 * Project leaderboard for a dimension
 */
export async function projectLeaderboard(
  organizationId: string,
  dimension: 'COMPETITIVE' | 'DEVELOPMENT' | 'ACTIVITY',
  leaderboardType: LeaderboardType = 'GLOBAL'
): Promise<{ projected: number; updatedAt: Date }> {
  // Get players ranked by dimension
  let snapshots: any[] = [];
  
  if (dimension === 'COMPETITIVE') {
    snapshots = await prisma.competitiveRankSnapshot.findMany({
      where: { organizationId },
      orderBy: { currentScore: 'desc' },
      take: 1000,  // Top 1000
    });
  } else if (dimension === 'DEVELOPMENT') {
    snapshots = await prisma.developmentScoreSnapshot.findMany({
      where: { organizationId },
      orderBy: { currentScore: 'desc' },
      take: 1000,
    });
  } else if (dimension === 'ACTIVITY') {
    snapshots = await prisma.activityScoreSnapshot.findMany({
      where: { organizationId },
      orderBy: { currentScore: 'desc' },
      take: 1000,
    });
  }
  
  // Determine leaderboard type and filter
  let filteredSnapshots = snapshots;
  
  // For now, keep all. In future, add regional/age-group filtering
  
  // Delete existing projections
  await prisma.leaderboardProjection.deleteMany({
    where: {
      organizationId,
      leaderboardType,
    },
  });
  
  // Create new projections with ranks
  let created = 0;
  
  for (let i = 0; i < filteredSnapshots.length; i++) {
    const snapshot = filteredSnapshots[i];
    
    const player = await prisma.player.findUnique({
      where: { userId: snapshot.playerId },
      select: { 
        user: { select: { firstName: true, lastName: true } },
        organizationId: true,
      },
    });
    
    if (!player) continue;
    
    await prisma.leaderboardProjection.create({
      data: {
        organizationId,
        leaderboardType,
        playerId: snapshot.playerId,
        rank: i + 1,
        score: snapshot.currentScore,
        displayName: `${player.user.firstName} ${player.user.lastName}`,
        metadata: {
          dimension,
          playerOrganization: player.organizationId,
          projectedAt: new Date().toISOString(),
        },
      },
    });
    
    created++;
  }
  
  return { projected: created, updatedAt: new Date() };
}

/**
 * Get top N players for a leaderboard
 */
export async function getLeaderboard(
  organizationId: string,
  leaderboardType: LeaderboardType = 'GLOBAL',
  limit: number = 100
): Promise<Array<{
  rank: number;
  playerId: string;
  displayName: string;
  score: number;
}>> {
  const projections = await prisma.leaderboardProjection.findMany({
    where: {
      organizationId,
      leaderboardType,
    },
    orderBy: { rank: 'asc' },
    take: limit,
  });
  
  return projections.map(p => ({
    rank: p.rank,
    playerId: p.playerId,
    displayName: p.displayName,
    score: p.score,
  }));
}

/**
 * Get player's rank and context
 */
export async function getPlayerLeaderboardContext(
  playerId: string,
  organizationId: string,
  leaderboardType: LeaderboardType = 'GLOBAL'
): Promise<{
  rank: number;
  score: number;
  percentileRank: number;
  totalPlayers: number;
  nearbyPlayers: Array<{ rank: number; displayName: string; score: number }>;
} | null> {
  const projection = await prisma.leaderboardProjection.findFirst({
    where: {
      playerId,
      organizationId,
      leaderboardType,
    },
  });
  
  if (!projection) {
    return null;
  }
  
  // Get total players on leaderboard
  const totalPlayers = await prisma.leaderboardProjection.count({
    where: { organizationId, leaderboardType },
  });
  
  // Get nearby players
  const nearbyPlayers = await prisma.leaderboardProjection.findMany({
    where: {
      organizationId,
      leaderboardType,
      rank: {
        gte: Math.max(1, projection.rank - 2),
        lte: projection.rank + 2,
      },
    },
    select: { rank: true, displayName: true, score: true },
    orderBy: { rank: 'asc' },
  });
  
  return {
    rank: projection.rank,
    score: projection.score,
    percentileRank: (projection.rank / totalPlayers) * 100,
    totalPlayers,
    nearbyPlayers: nearbyPlayers as any,
  };
}

/**
 * Check if leaderboard needs refresh
 */
export async function shouldRefreshLeaderboard(
  organizationId: string,
  leaderboardType: LeaderboardType = 'GLOBAL'
): Promise<boolean> {
  // Get last projection time
  const lastProjection = await prisma.leaderboardProjection.findFirst({
    where: { organizationId, leaderboardType },
    orderBy: { lastProjectedAt: 'desc' },
    select: { lastProjectedAt: true },
  });
  
  if (!lastProjection) {
    return true;  // No projections exist yet
  }
  
  // Refresh if older than 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return lastProjection.lastProjectedAt < fiveMinutesAgo;
}

/**
 * Bulk refresh all leaderboards
 */
export async function refreshAllLeaderboards(
  organizationId: string
): Promise<{ updated: number; totalTime: number }> {
  const startTime = Date.now();
  let updated = 0;
  
  const dimensions: Array<'COMPETITIVE' | 'DEVELOPMENT' | 'ACTIVITY'> = [
    'COMPETITIVE',
    'DEVELOPMENT',
    'ACTIVITY',
  ];
  
  for (const dimension of dimensions) {
    const result = await projectLeaderboard(organizationId, dimension, 'GLOBAL');
    updated += result.projected;
  }
  
  const totalTime = Date.now() - startTime;
  
  return { updated, totalTime };
}

/**
 * Get leaderboard statistics
 */
export async function getLeaderboardStats(
  organizationId: string
): Promise<{
  totalPlayers: number;
  averageScore: number;
  topPlayerScore: number;
  lastProjectedAt: Date | null;
}> {
  const projections = await prisma.leaderboardProjection.findMany({
    where: { organizationId, leaderboardType: 'GLOBAL' },
    select: { score: true, lastProjectedAt: true },
    orderBy: { score: 'desc' },
  });
  
  const scores = projections.map(p => p.score);
  const averageScore = scores.length > 0 
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0;
  
  return {
    totalPlayers: projections.length,
    averageScore: Math.round(averageScore),
    topPlayerScore: scores[0] || 0,
    lastProjectedAt: projections[0]?.lastProjectedAt || null,
  };
}
