import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

/**
 * GET /api/referee/tasks/[taskId]/progress
 * Get comprehensive task progress including:
 * - Match progress
 * - Scheduled vs played matches
 * - Player standings/performance
 * - Resource status
 * - Timeline
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { taskId } = await params;

    // Get task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        status: true,
        assignedToId: true,
        startedAt: true,
        completedAt: true,
        context: true,
        organization: { select: { id: true, name: true } },
        template: { select: { name: true, type: true } },
        resourceRequests: {
          select: {
            id: true,
            resourceType: true,
            quantity: true,
            status: true,
            requestedAt: true,
            approvedAt: true,
          }
        }
      }
    });

    if (!task) {
      return new Response(
        JSON.stringify({ error: 'Task not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (task.assignedToId !== auth.playerId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const context = task.context as any;

    // Get tournament matches for this event
    let matches: any[] = [];
    let playerStats: Record<string, any> = {};

    if (context?.eventId) {
      matches = await prisma.tournamentMatch.findMany({
        where: { eventId: context.eventId },
        include: {
          playerA: {
            select: {
              id: true,
              player: {
                select: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                    }
                  }
                }
              }
            }
          },
          playerB: {
            select: {
              id: true,
              player: {
                select: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                    }
                  }
                }
              }
            }
          },
        },
        orderBy: { scheduledTime: 'asc' }
      });

      // Calculate player statistics
      matches.forEach((match: any) => {
        const playerA = match.playerA?.player?.user;
        const playerB = match.playerB?.player?.user;
        
        if (playerA && playerA.id) {
          if (!playerStats[playerA.id]) {
            playerStats[playerA.id] = {
              id: playerA.id,
              name: `${playerA.firstName} ${playerA.lastName}`,
              matches: 0,
              wins: 0,
              losses: 0,
            };
          }
        }
        if (playerB && playerB.id) {
          if (!playerStats[playerB.id]) {
            playerStats[playerB.id] = {
              id: playerB.id,
              name: `${playerB.firstName} ${playerB.lastName}`,
              matches: 0,
              wins: 0,
              losses: 0,
            };
          }
        }

        if (match.status === 'done' || match.status === 'completed') {
          if (playerA?.id) playerStats[playerA.id].matches++;
          if (playerB?.id) playerStats[playerB.id].matches++;

          // Determine winner based on scores
          if (match.winnerId && playerA?.id && playerB?.id) {
            if (match.winnerId === match.playerAId) {
              playerStats[playerA.id].wins++;
              playerStats[playerB.id].losses++;
            } else {
              playerStats[playerB.id].wins++;
              playerStats[playerA.id].losses++;
            }
          }
        }
      });
    }

    // Calculate match statistics
    const totalMatches = matches.length;
    const completedMatches = matches.filter(m => m.status === 'done' || m.status === 'completed').length;
    const inProgressMatches = matches.filter(m => m.status === 'in_progress' || m.status === 'active').length;
    const scheduledMatches = matches.filter(m => m.status === 'pending' || m.status === 'scheduled').length;
    const cancelledMatches = matches.filter(m => m.status === 'cancelled').length;

    // Get upcoming matches (next 3)
    const upcomingMatches = matches
      .filter((m: any) => m.status === 'pending' || m.status === 'scheduled')
      .slice(0, 3)
      .map((m: any) => ({
        id: m.id,
        playerA: m.playerA?.user ? `${m.playerA.user.firstName} ${m.playerA.user.lastName}` : 'TBD',
        playerB: m.playerB?.user ? `${m.playerB.user.firstName} ${m.playerB.user.lastName}` : 'TBD',
        scheduledTime: m.scheduledTime,
        status: m.status,
      }));

    // Get recently completed matches
    const recentMatches = matches
      .filter((m: any) => m.status === 'done' || m.status === 'completed')
      .sort((a: any, b: any) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0))
      .slice(0, 5)
      .map((m: any) => ({
        id: m.id,
        playerA: m.playerA?.user ? `${m.playerA.user.firstName} ${m.playerA.user.lastName}` : 'TBD',
        playerB: m.playerB?.user ? `${m.playerB.user.firstName} ${m.playerB.user.lastName}` : 'TBD',
        score: `${m.scoreSetA || 0}-${m.scoreSetB || 0}`,
        winner: m.winnerId ? (m.winnerId === m.playerAId ? m.playerA?.user : m.playerB?.user) : null,
        completedAt: m.updatedAt,
      }));

    // Calculate resource statistics
    const resourceStats = {
      total: task.resourceRequests.length,
      pending: task.resourceRequests.filter((r: any) => r.status === 'PENDING').length,
      approved: task.resourceRequests.filter((r: any) => r.status === 'APPROVED').length,
      rejected: task.resourceRequests.filter((r: any) => r.status === 'REJECTED').length,
    };

    return new Response(JSON.stringify({
      task: {
        id: task.id,
        title: task.template?.name,
        type: task.template?.type,
        status: task.status,
        organization: task.organization,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
      },
      progress: {
        overallPercentage: totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0,
        matches: {
          total: totalMatches,
          completed: completedMatches,
          inProgress: inProgressMatches,
          scheduled: scheduledMatches,
          cancelled: cancelledMatches,
        },
      },
      playerPerformance: Object.values(playerStats)
        .sort((a: any, b: any) => b.wins - a.wins),
      resources: {
        requests: task.resourceRequests,
        stats: resourceStats,
      },
      upcomingMatches,
      recentMatches,
      timeline: {
        taskStarted: task.startedAt,
        taskCompleted: task.completedAt,
        firstMatch: matches.length > 0 ? matches[0].scheduledTime : null,
        lastScheduledMatch: matches.length > 0 ? matches[matches.length - 1].scheduledTime : null,
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching task progress:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch task progress' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
