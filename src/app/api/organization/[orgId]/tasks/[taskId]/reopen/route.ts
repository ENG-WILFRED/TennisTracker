import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';
import { broadcastToUser } from '@/lib/websocket-broadcast';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; taskId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { orgId, taskId } = await params;

    // Fetch current task
    const task = await prisma.eventTask.findUnique({
      where: { id: taskId },
      include: {
        assignedTo: {
          select: {
            userId: true,
            user: { select: { firstName: true, lastName: true, email: true } }
          }
        }
      }
    });

    if (!task) {
      return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
    }

    if (task.organizationId !== orgId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
    }

    // Only allow reopening rejected tasks
    if (task.status !== 'rejected') {
      return new Response(JSON.stringify({ error: 'Can only reopen rejected tasks' }), { status: 400 });
    }

    // Reopen task (change back to pending)
    const updatedTask = await prisma.eventTask.update({
      where: { id: taskId },
      data: {
        status: 'pending',
        rejectionReason: null,
        updatedAt: new Date(),
      },
      include: {
        assignedTo: {
          select: {
            userId: true,
            user: { select: { firstName: true, lastName: true, email: true } }
          }
        }
      }
    });

    // Broadcast to assigned user
    if (updatedTask.assignedTo?.userId) {
      broadcastToUser(updatedTask.assignedTo.userId, {
        type: 'task_reopened',
        taskId: updatedTask.id,
        taskTitle: updatedTask.title,
        message: `Task "${updatedTask.title}" has been reopened and requires your action`,
        timestamp: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify(updatedTask), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error reopening task:', error);
    return new Response(JSON.stringify({ error: 'Failed to reopen task' }), { status: 500 });
  }
}
