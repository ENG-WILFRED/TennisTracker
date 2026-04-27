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
 * GET /api/admin/tasks/by-role/[role]
 * Get tasks by role (COACH or REFEREE) with optional organization filter
 * Query params: organizationId, offset, limit, status
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ role: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { role } = await params;

    // Get query parameters
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const statusFilter = url.searchParams.get('status');

    // Validate role
    if (!['COACH', 'REFEREE'].includes(role.toUpperCase())) {
      return new Response(
        JSON.stringify({ error: 'Invalid role. Must be COACH or REFEREE' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const upperRole = role.toUpperCase();
    console.log(`📋 Fetching ${upperRole} tasks, offset: ${offset}, limit: ${limit}`);

    // Build where clause
    const whereClause: any = {};

    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

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

    // Filter by role via template
    whereClause.template = {
      role: upperRole,
    };

    // Get total count
    const totalCount = await prisma.task.count({
      where: whereClause,
    });

    // Get status summary
    const statusSummary = await prisma.task.groupBy({
      by: ['status'],
      where: organizationId ? { organizationId, template: { role: upperRole } } : { template: { role: upperRole } },
      _count: true,
    });

    // Fetch tasks
    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        template: {
          select: {
            name: true,
            type: true,
            organizationId: true,
          }
        },
        assignedTo: {
          select: {
            userId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            },
            role: true,
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

    console.log(`✅ Found ${tasks.length} ${upperRole} tasks`);

    // Format tasks
    const formattedTasks = tasks.map((task: typeof tasks[number]) => ({
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
      assignedTo: task.assignedTo ? {
        id: task.assignedTo.userId,
        name: `${task.assignedTo.user.firstName} ${task.assignedTo.user.lastName}`,
        email: task.assignedTo.user.email,
        role: task.assignedTo.role,
      } : null,
      assignedBy: task.assignedBy ? `${task.assignedBy.firstName} ${task.assignedBy.lastName}` : null,
      organization: task.organization?.name,
      context: task.context,
      templateId: task.templateId,
      rejectionReason: task.rejectionReason,
    }));

    // Build summary
    const summary = {
      total: totalCount,
      pending: statusSummary.find((s: typeof statusSummary[number]) => s.status === 'ASSIGNED')?._count || 0,
      accepted: statusSummary.find((s: typeof statusSummary[number]) => s.status === 'ACCEPTED')?._count || 0,
      in_progress: statusSummary.find((s: typeof statusSummary[number]) => s.status === 'IN_PROGRESS')?._count || 0,
      completed: statusSummary.find((s: typeof statusSummary[number]) => s.status === 'COMPLETED')?._count || 0,
      rejected: statusSummary.find((s: typeof statusSummary[number]) => s.status === 'FAILED')?._count || 0,
      cancelled: statusSummary.find((s: typeof statusSummary[number]) => s.status === 'CANCELLED')?._count || 0,
    };

    return new Response(
      JSON.stringify({
        tasks: formattedTasks,
        total: totalCount,
        offset,
        limit,
        role: upperRole,
        organizationId: organizationId || null,
        summary,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error fetching tasks by role:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch tasks' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
