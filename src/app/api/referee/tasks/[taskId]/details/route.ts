import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

/**
 * GET /api/referee/tasks/[taskId]/details
 * Get detailed information about a specific task including:
 * - Event/Tournament info
 * - Players involved
 * - Current matches created
 * - Task progress
 * - Resource requests
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

    // Get complete task details
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            type: true,
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
          }
        },
        assignedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        submissions: {
          select: {
            id: true,
            formData: true,
            reviewStatus: true,
            submittedAt: true,
            pdfUrl: true,
          }
        },
        history: {
          select: {
            id: true,
            action: true,
            status: true,
            changedBy: {
              select: {
                firstName: true,
                lastName: true,
              }
            },
            notes: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' }
        },
        resourceRequests: {
          select: {
            id: true,
            resourceType: true,
            quantity: true,
            status: true,
            requestedAt: true,
            approvedAt: true,
            description: true,
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

    // Verify the task is assigned to the current user
    if (task.assignedToId !== auth.playerId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get event details if available
    let event = null;
    let registeredMembers: any[] = [];
    let matches: any[] = [];

    if ((task.context as any)?.eventId) {
      const eventId = (task.context as any).eventId;
      
      event = await prisma.clubEvent.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          eventType: true,
          registrations: {
            select: {
              id: true,
              memberId: true,
              member: {
                select: {
                  id: true,
                  player: {
                    select: {
                      user: {
                        select: {
                          id: true,
                          firstName: true,
                          lastName: true,
                          email: true,
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (event) {
        registeredMembers = event.registrations.map((reg: any) => ({
          id: reg.memberId,
          userId: reg.member.player.user.id,
          name: `${reg.member.player.user.firstName} ${reg.member.player.user.lastName}`,
          email: reg.member.player.user.email,
        }));

        const matchRows = await prisma.tournamentMatch.findMany({
          where: { eventId },
          include: {
            playerA: {
              include: {
                player: {
                  include: {
                    user: true,
                  }
                }
              }
            },
            playerB: {
              include: {
                player: {
                  include: {
                    user: true,
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        });

        matches = matchRows.map((m: any, index: number) => ({
          id: m.id,
          playerA: m.playerA?.player?.user ? {
            id: m.playerA.id,
            name: `${m.playerA.player.user.firstName} ${m.playerA.player.user.lastName}`,
            email: m.playerA.player.user.email,
          } : { name: 'TBD' },
          playerB: m.playerB?.player?.user ? {
            id: m.playerB.id,
            name: `${m.playerB.player.user.firstName} ${m.playerB.player.user.lastName}`,
            email: m.playerB.player.user.email,
          } : { name: 'TBD' },
          score: `${m.scoreSetA || 0}-${m.scoreSetB || 0}`,
          status: m.status,
          scheduledTime: m.scheduledTime,
          createdAt: m.createdAt,
          group: `Group ${String.fromCharCode(65 + (m.matchPosition || index))}`,
        }));
      }
    }

    // Calculate progress
    const totalMatches = matches.length;
    const completedMatches = matches.filter((m: any) => m.status === 'completed' || m.status === 'done').length;
    const scheduledMatches = matches.filter((m: any) => m.status === 'pending' || m.status === 'scheduled').length;
    const progress = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

    return new Response(JSON.stringify({
      task: {
        id: task.id,
        title: task.template?.name || 'Task',
        type: task.template?.type || 'General',
        status: task.status,
        description: task.notes,
        dueDate: task.dueDate,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
        createdAt: task.createdAt,
        organization: task.organization,
        assignedBy: task.assignedBy ? `${task.assignedBy.firstName} ${task.assignedBy.lastName}` : null,
        rejectionReason: task.rejectionReason,
      },
      event: event ? {
        id: event.id,
        name: event.name,
        startDate: event.startDate,
        endDate: event.endDate,
        eventType: event.eventType,
        playerCount: registeredMembers.length,
      } : null,
      players: registeredMembers,
      matches: {
        total: totalMatches,
        completed: completedMatches,
        scheduled: scheduledMatches,
        list: matches,
      },
      progress: {
        percentage: progress,
        matchesCompleted: completedMatches,
        matchesScheduled: scheduledMatches,
        totalMatches: totalMatches,
      },
      resourceRequests: task.resourceRequests || [],
      submissions: task.submissions,
      history: task.history,
      context: task.context,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching task details:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch task details' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
