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
 * GET /api/admin/tasks/my-tasks
 * Get all tasks assigned to the authenticated user
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

    // Get pagination parameters
    const url = new URL(request.url);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const statusFilter = url.searchParams.get('status');

    console.log(`📋 Fetching my tasks for user: ${auth.playerId}, offset: ${offset}, limit: ${limit}`);

    // Find the staff member for this user
    const staff = await prisma.staff.findFirst({
      where: {
        userId: auth.playerId,
      },
      select: {
        userId: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    if (!staff) {
      return new Response(
        JSON.stringify({ error: 'Staff member not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build where clause
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

    console.log(`✅ Found ${typedTasks.length} tasks for user ${auth.playerId}`);

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
    }));

    return new Response(
      JSON.stringify({
        tasks: formattedTasks,
        total: totalCount,
        offset,
        limit,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error fetching my tasks:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch tasks' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
