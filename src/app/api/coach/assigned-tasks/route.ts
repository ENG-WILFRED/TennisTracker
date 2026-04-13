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
 * GET /api/coach/assigned-tasks
 * Get tasks assigned to authenticated coach
 */
export async function GET(request: Request) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get pagination parameters from query
    const url = new URL(request.url);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const statusFilter = url.searchParams.get('status');

    // Query NEW typed Task model (active tasks only)
    const whereClause: any = {
      assignedToId: auth.playerId,
    };

    if (statusFilter && statusFilter !== 'all') {
      // Convert UI status to TaskStatus enum
      const statusMap: Record<string, string> = {
        pending: 'ASSIGNED',
        accepted: 'ACCEPTED',
        in_progress: 'IN_PROGRESS',
        completed: 'COMPLETED',
        rejected: 'FAILED',
        cancelled: 'CANCELLED',
      };
      whereClause.status = statusMap[statusFilter] || statusFilter;
    } else {
      // By default, show active tasks (not completed/rejected/cancelled)
      whereClause.status = { in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] };
    }

    const [typedTaskCount, typedTasks] = await Promise.all([
      prisma.task.count({
        where: whereClause,
      }),
      prisma.task.findMany({
        where: whereClause,
        include: {
          template: {
            select: {
              name: true,
              type: true,
            }
          },
          organization: {
            select: {
              name: true,
            }
          },
          assignedBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            }
          },
        },
        orderBy: [
          { status: 'asc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ],
        skip: offset,
        take: limit,
      })
    ]);

    // Format typed tasks
    const formattedTasks = typedTasks.map(task => ({
      id: task.id,
      title: task.template?.name || 'Task',
      description: task.notes,
      role: task.template?.type || 'Task',
      status: mapTaskStatus(task.status),
      priority: (task.context as any)?.priority || 'normal',
      rejectionReason: task.rejectionReason,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      organization: task.organization?.name,
      templateId: task.templateId,
      assignedBy: task.assignedBy ? `${task.assignedBy.firstName} ${task.assignedBy.lastName}` : null,
      source: 'typed_task'
    }));

    return new Response(JSON.stringify({
      tasks: formattedTasks,
      total: typedTaskCount,
      offset,
      limit,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching coach assigned tasks:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch assigned tasks' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
