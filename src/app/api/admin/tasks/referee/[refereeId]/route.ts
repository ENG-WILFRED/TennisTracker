import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

// Helper function to map TaskStatus enum to UI status values
function mapTaskStatus(taskStatus: string): string {
  const statusMap: Record<string, string> = {
    ASSIGNED: 'pending',
    ACCEPTED: 'accepted',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'rejected',
    CANCELLED: 'cancelled',
  };
  return statusMap[taskStatus] || taskStatus.toLowerCase();
}

/**
 * GET /api/admin/tasks/referee/[refereeId]
 * Get all tasks assigned to a specific referee
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ refereeId: string }> }
) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { refereeId } = await params;

    // Get pagination parameters
    const url = new URL(request.url);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const statusFilter = url.searchParams.get('status');

    console.log(`📋 Fetching referee tasks for referee: ${refereeId}, offset: ${offset}, limit: ${limit}`);

    // Verify referee exists
    const referee = await prisma.referee.findFirst({
      where: {
        userId: refereeId,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    if (!referee) {
      return new Response(
        JSON.stringify({ error: 'Referee not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build where clause
    const whereClause: any = {
      assignedToId: refereeId,
    };

    if (statusFilter && statusFilter !== 'all') {
      const statusMap: Record<string, string> = {
        pending: 'ASSIGNED',
        accepted: 'ACCEPTED',
        in_progress: 'IN_PROGRESS',
        completed: 'COMPLETED',
        rejected: 'FAILED',
        cancelled: 'CANCELLED',
      };
      whereClause.status = statusMap[statusFilter] || statusFilter;
    }

    // Get total count
    const totalCount = await prisma.task.count({
      where: whereClause,
    });

    // Fetch typed tasks
    const typedTasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        template: {
          select: {
            name: true,
            type: true,
            organizationId: true,
          }
        },
        assignedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        organization: {
          select: {
            name: true,
          }
        },
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' }
      ],
      skip: offset,
      take: limit,
    });

    console.log(`✅ Found ${typedTasks.length} tasks for referee ${refereeId}`);

    // Format tasks
    const formattedTasks = typedTasks.map(task => ({
      id: task.id,
      title: task.template?.name || 'Task',
      description: task.notes,
      role: task.template?.type || 'Task',
      status: mapTaskStatus(task.status),
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      notes: task.notes,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      assignedBy: task.assignedBy ? `${task.assignedBy.firstName} ${task.assignedBy.lastName}` : null,
      organization: task.organization?.name,
      context: task.context,
      templateId: task.templateId,
      rejectionReason: task.rejectionReason,
      refereeName: `${referee.user.firstName} ${referee.user.lastName}`,
      refereeEmail: referee.user.email,
    }));

    return new Response(
      JSON.stringify({
        tasks: formattedTasks,
        total: totalCount,
        offset,
        limit,
        referee: {
          id: referee.userId,
          name: `${referee.user.firstName} ${referee.user.lastName}`,
          email: referee.user.email,
          matchesRefereed: referee.matchesRefereed,
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error fetching referee tasks:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch tasks' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
