/**
 * Replayable Calculation Engine
 * 
 * CRITICAL for enterprise ranking systems:
 * - Recalculate rankings with new formulas
 * - Rebuild leaderboards
 * - Audit historical calculations
 * - Support formula migrations
 * 
 * Snapshots are NOT source-of-truth. Events are.
 */

import prisma from '@/lib/prisma';
import { FormulaRegistry, FormulaVersion } from '../formulas/formula-versioning';
import { calculateCompetitiveRank } from '../calculators/competitive-rank.calculator';
import { calculateDevelopmentScore } from '../calculators/development-score.calculator';
import { calculateActivityScore } from '../calculators/activity-score.calculator';

export interface RecalculationTask {
  id: string;
  organizationId: string;
  
  // Scope
  playerId?: string;               // Single player or all?
  fromDate?: Date;
  toDate?: Date;
  
  // Formula
  formulaVersion: string;          // v1, v2, etc
  
  // Status
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  progress: number;                // 0-100
  
  // Results
  playersProcessed: number;
  snapshotsCreated: number;
  eventsReplayed: number;
  
  // Audit trail
  requestedBy: string;
  requestedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // Errors
  errors: string[];
}

/**
 * Replay all ranking events from history
 * Rebuilds snapshots using specified formula
 */
export async function replayRankingEvents(
  organizationId: string,
  formulaRegistry: FormulaRegistry,
  formulaVersion: string,
  specificPlayerId?: string
): Promise<RecalculationTask> {
  const formula = formulaRegistry.get(formulaVersion);
  if (!formula) {
    throw new Error(`Formula version ${formulaVersion} not found`);
  }
  
  const task: RecalculationTask = {
    id: crypto.randomUUID?.() || Date.now().toString(),
    organizationId,
    formulaVersion,
    status: 'IN_PROGRESS',
    progress: 0,
    playersProcessed: 0,
    snapshotsCreated: 0,
    eventsReplayed: 0,
    requestedBy: 'system',
    requestedAt: new Date(),
    startedAt: new Date(),
    errors: [],
  };
  
  try {
    // Get all players in organization
    let players = await prisma.player.findMany({
      where: specificPlayerId ? { userId: specificPlayerId } : {},
      select: { userId: true, organizationId: true },
    });
    
    const totalPlayers = players.length;
    
    // Replay for each player
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      
      try {
        // Get all ranking events for this player
        const events = await prisma.rankingEvent.findMany({
          where: {
            playerId: player.userId,
            organizationId,
          },
          orderBy: { createdAt: 'asc' },
        });
        
        task.eventsReplayed += events.length;
        
        // Recalculate snapshots for each time period
        await recalculatePlayerSnapshots(
          player.userId,
          organizationId,
          formula,
          events
        );
        
        task.snapshotsCreated += 3;  // 3 dimensions: competitive, development, activity
        task.playersProcessed++;
        
      } catch (error) {
        task.errors.push(
          `Failed to recalculate player ${player.userId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
      
      // Update progress
      task.progress = Math.floor((i + 1) / totalPlayers * 100);
    }
    
    task.status = 'COMPLETED';
    task.completedAt = new Date();
    
  } catch (error) {
    task.status = 'FAILED';
    task.errors.push(error instanceof Error ? error.message : 'Unknown error');
    task.completedAt = new Date();
  }
  
  return task;
}

/**
 * Recalculate snapshots for a player using events
 */
async function recalculatePlayerSnapshots(
  playerId: string,
  organizationId: string,
  formula: FormulaVersion,
  events: any[]
): Promise<void> {
  if (events.length === 0) return;
  
  // Clear existing snapshots
  await prisma.competitiveRankSnapshot.deleteMany({
    where: { playerId, organizationId },
  });
  
  await prisma.developmentScoreSnapshot.deleteMany({
    where: { playerId, organizationId },
  });
  
  await prisma.activityScoreSnapshot.deleteMany({
    where: { playerId, organizationId },
  });
  
  // Replay events chronologically
  for (const event of events) {
    const eventDate = event.createdAt;
    
    // Recalculate based on event type
    if (event.eventType === 'MATCH_COMPLETED') {
      const result = await calculateCompetitiveRank({
        playerId,
        organizationId,
        period: { startDate: new Date(0), endDate: eventDate },
      });
      if (result.currentScore > 0) {
        await prisma.competitiveRankSnapshot.create({
          data: {
            playerId,
            organizationId,
            currentScore: result.currentScore,
            previousScore: result.previousScore,
            matchesWon: result.metadata.matchesWon || 0,
            matchesLost: result.metadata.matchesLost || 0,
            winRate: result.metadata.winRate || 0,
            tournamentWins: result.metadata.tournamentWins || 0,
            opponentStrengthAvg: result.metadata.opponentStrength || 0,
            rank: 0,
            lastUpdated: eventDate,
          },
        });
      }
    }
    
    if (event.eventType === 'COACHING_SESSION_ATTENDED') {
      const result = await calculateDevelopmentScore(
        playerId,
        organizationId,
        formula,
        { startDate: new Date(0), endDate: eventDate }
      );
      
      if (result.currentScore > 0) {
        await prisma.developmentScoreSnapshot.create({
          data: {
            playerId,
            organizationId,
            currentScore: result.currentScore,
            previousScore: result.previousScore,
            coachingSessionsAttended: result.metadata.sessionsCount || 0,
            consistencyStreak: 0,
            improvementTrend: 0,
            coachAssessmentScore: 0,
            practiceParticipation: 0,
            lastUpdated: eventDate,
          },
        });
      }
    }
    
    if (event.eventType === 'BOOKING_COMPLETED') {
      const result = await calculateActivityScore(
        playerId,
        organizationId,
        formula,
        { startDate: new Date(0), endDate: eventDate }
      );
      
      if (result.currentScore > 0) {
        await prisma.activityScoreSnapshot.create({
          data: {
            playerId,
            organizationId,
            currentScore: result.currentScore,
            previousScore: result.previousScore,
            bookingsThisMonth: result.metadata.bookingsCount || 0,
            courtAppearances: 0,
            matchesPlayed: result.metadata.matchesCount || 0,
            recentParticipationFrequency: 0,
            consecutiveDaysActive: result.metadata.consecutiveDays || 0,
            lastUpdated: eventDate,
          },
        });
      }
    }
  }
}

/**
 * Rebuild all leaderboards
 */
export async function rebuildLeaderboards(
  organizationId: string
): Promise<{ leaderboardsUpdated: number; playersRanked: number }> {
  let playersRanked = 0;
  
  // Get all competitive rank snapshots, sorted by score
  const competitiveSnapshots = await prisma.competitiveRankSnapshot.findMany({
    where: { organizationId },
    orderBy: { currentScore: 'desc' },
  });
  
  // Delete existing leaderboard projections
  await prisma.leaderboardProjection.deleteMany({
    where: { organizationId, leaderboardType: 'GLOBAL' },
  });
  
  // Create new projections with ranks
  for (let i = 0; i < competitiveSnapshots.length; i++) {
    const snapshot = competitiveSnapshots[i];
    
    const player = await prisma.player.findUnique({
      where: { userId: snapshot.playerId },
      select: { user: { select: { firstName: true, lastName: true } } },
    });
    
    await prisma.leaderboardProjection.create({
      data: {
        organizationId,
        leaderboardType: 'GLOBAL',
        playerId: snapshot.playerId,
        rank: i + 1,
        score: snapshot.currentScore,
        displayName: player ? `${player.user.firstName} ${player.user.lastName}` : 'Unknown',
        lastProjectedAt: new Date(),
      },
    });
    
    playersRanked++;
  }
  
  return { leaderboardsUpdated: 1, playersRanked };
}

/**
 * Validate ranking integrity
 */
export async function validateRankingIntegrity(
  organizationId: string
): Promise<{
  isValid: boolean;
  issues: string[];
  totalSnapshots: number;
  totalEvents: number;
}> {
  const issues: string[] = [];
  
  const [snapshotCount, eventCount] = await Promise.all([
    prisma.competitiveRankSnapshot.count({ where: { organizationId } }),
    prisma.rankingEvent.count({ where: { organizationId } }),
  ]);
  
  // Validation rules
  if (snapshotCount === 0 && eventCount > 0) {
    issues.push('No snapshots found but events exist - rankings may not have been calculated');
  }
  
  // Check for orphaned events (events without snapshots)
  const events = await prisma.rankingEvent.findMany({
    where: { organizationId },
  });
  
  for (const event of events) {
    const snapshot = await prisma.competitiveRankSnapshot.findFirst({
      where: { playerId: event.playerId, organizationId },
    });
    
    if (!snapshot) {
      issues.push(`No snapshot found for player ${event.playerId} after event ${event.eventType}`);
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    totalSnapshots: snapshotCount,
    totalEvents: eventCount,
  };
}
