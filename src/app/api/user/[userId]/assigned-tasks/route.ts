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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { userId } = await params;
    
    // Get pagination parameters from query
    const url = new URL(request.url);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Query NEW typed Task model (active tasks only)
    const [typedTaskCount, typedTasks, eventTaskCount, eventTasks] = await Promise.all([
      prisma.task.count({
        where: {
          assignedToId: userId,
          status: { in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] }
        }
      }),
      prisma.task.findMany({
        where: {
          assignedToId: userId,
          status: { in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] }
        },
        include: {
          template: {
            select: {
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
        },
        orderBy: [
          { status: 'asc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ],
      }),
      // Query legacy EventTask model
      prisma.eventTask.count({
        where: {
          staffUserId: userId,
          status: { in: ['pending', 'accepted', 'in_progress'] }
        }
      }),
      prisma.eventTask.findMany({
        where: {
          staffUserId: userId,
          status: { in: ['pending', 'accepted', 'in_progress'] }
        },
        include: {
          event: {
            select: {
              id: true,
              name: true,
            }
          },
        },
        orderBy: [
          { status: 'asc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ],
      })
    ]);

    // Format typed tasks
    const formattedTypedTasks = typedTasks.map(task => {
      const formatted = {
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
        organizationId: task.organizationId,
        organization: task.organization?.name,
        templateId: task.templateId,
        source: 'typed_task'
      };
      if (!task.organizationId) {
        console.warn(`[AssignedTasks] Typed task ${task.id} missing organizationId`);
      }
      return formatted;
    });

    // Format legacy event tasks
    const formattedEventTasks = eventTasks.map(task => ({
      id: task.id,
      eventId: task.eventId,
      organizationId: task.organizationId,
      title: task.title,
      description: task.description,
      role: task.role,
      responsibility: task.responsibility,
      status: task.status,
      priority: task.priority,
      rejectionReason: task.rejectionReason,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      event: task.event,
      source: 'event_task'
    }));

    // Combine and sort results
    const allTasks = [...formattedTypedTasks, ...formattedEventTasks].sort((a, b) => {
      // Sort by status first (pending, accepted, in_progress)
      const statusOrder = { 'pending': 0, 'accepted': 1, 'in_progress': 2 };
      const aStatus = statusOrder[a.status as keyof typeof statusOrder] ?? 3;
      const bStatus = statusOrder[b.status as keyof typeof statusOrder] ?? 3;
      
      if (aStatus !== bStatus) return aStatus - bStatus;
      
      // Then by due date
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      
      return aDue - bDue;
    });

    const totalCount = typedTaskCount + eventTaskCount;
    const paginatedTasks = allTasks.slice(offset, offset + limit);

    return new Response(JSON.stringify({
      tasks: paginatedTasks,
      total: totalCount,
      offset,
      limit,
      counts: {
        typedTasks: typedTaskCount,
        eventTasks: eventTaskCount
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching assigned tasks:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch assigned tasks' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
