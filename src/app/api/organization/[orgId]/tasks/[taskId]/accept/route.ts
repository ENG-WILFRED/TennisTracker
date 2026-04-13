import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';
import { broadcastToUser } from '@/lib/websocket-broadcast';
import { TaskStatus } from '@/types/task-system';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; taskId: string }> }
) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { orgId, taskId } = await params;

    // Validate orgId is not undefined
    if (!orgId || orgId === 'undefined') {
      console.error(`[Accept Task] Invalid orgId: ${orgId}, taskId: ${taskId}`);
      return new Response(JSON.stringify({ error: 'Invalid organization ID' }), { status: 400 });
    }

    // Try to find typed Task first
    let typedTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (typedTask) {
      // Handle new typed Task model
      if (typedTask.organizationId !== orgId) {
        console.error(`[Accept Task] Org mismatch - Task org: ${typedTask.organizationId}, URL org: ${orgId}`);
        return new Response(JSON.stringify({ error: 'Unauthorized - Organization mismatch' }), { status: 403 });
      }

      if (typedTask.status !== TaskStatus.ASSIGNED) {
        return new Response(
          JSON.stringify({ error: `Cannot accept task with status: ${typedTask.status}` }),
          { status: 400 }
        );
      }

      // Update typed task to ACCEPTED
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.ACCEPTED,
          updatedAt: new Date(),
        },
        include: {
          template: true,
          assignedTo: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true } }
            }
          }
        }
      });

      // Notify via WebSocket
      if (typedTask.assignedToId) {
        broadcastToUser(typedTask.assignedToId, {
          type: 'task-status-updated',
          data: {
            taskId: updatedTask.id,
            title: updatedTask.template?.name,
            status: 'accepted',
            timestamp: new Date().toISOString(),
          }
        });
      }

      return new Response(JSON.stringify(updatedTask), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fall back to legacy EventTask model
    const eventTask = await prisma.eventTask.findUnique({
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

    if (!eventTask) {
      return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
    }

    if (eventTask.organizationId !== orgId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
    }

    // Accept event task
    const updatedEventTask = await prisma.eventTask.update({
      where: { id: taskId },
      data: {
        status: 'accepted',
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

    // Notify via WebSocket
    if (eventTask.staffUserId) {
      broadcastToUser(eventTask.staffUserId, {
        type: 'task-status-updated',
        data: {
          taskId: updatedEventTask.id,
          title: updatedEventTask.title,
          status: 'accepted',
          timestamp: new Date().toISOString(),
        }
      });
    }

    return new Response(JSON.stringify(updatedEventTask), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error accepting task:', error);
    return new Response(JSON.stringify({ error: 'Failed to accept task' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
