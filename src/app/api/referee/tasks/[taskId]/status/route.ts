import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

/**
 * PUT /api/referee/tasks/[taskId]/status
 * Update task status
 * Allowed transitions:
 * - ASSIGNED -> ACCEPTED
 * - ACCEPTED -> IN_PROGRESS
 * - IN_PROGRESS -> COMPLETED
 * - Any -> FAILED (with reason)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { taskId } = await params;

    const body = await request.json();
    const { status, notes } = body;

    if (!status) {
      return new Response(
        JSON.stringify({ error: 'Status is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get current task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        status: true,
        assignedToId: true,
        startedAt: true,
        completedAt: true,
        statusHistory: true,
      }
    });

    if (!task) {
      return new Response(
        JSON.stringify({ error: 'Task not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify the task is assigned to current user
    if (task.assignedToId !== auth.userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      'ASSIGNED': ['ACCEPTED', 'CANCELLED'],
      'ACCEPTED': ['IN_PROGRESS', 'CANCELLED'],
      'IN_PROGRESS': ['COMPLETED', 'FAILED'],
      'COMPLETED': [],
      'FAILED': [],
      'CANCELLED': [],
    };

    if (!validTransitions[task.status]?.includes(status)) {
      return new Response(
        JSON.stringify({
          error: `Cannot transition from ${task.status} to ${status}`,
          validTransitions: validTransitions[task.status] || []
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare update data
    const updateData: any = {
      status,
    };

    // Set timestamps based on status
    if (status === 'IN_PROGRESS' && !task.startedAt) {
      updateData.startedAt = new Date();
    }
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    // Add to history
    const statusHistory = Array.isArray(task.statusHistory) ? task.statusHistory : [];
    statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      notes,
      changedBy: auth.userId,
    });
    updateData.statusHistory = statusHistory;

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        template: { select: { name: true, type: true } },
      }
    });

    // Create history record for audit trail
    await prisma.taskHistory.create({
      data: {
        taskId: taskId,
        action: status,
        status: task.status,
        changedByUserId: auth.userId,
        notes,
      }
    });

    return new Response(JSON.stringify({
      success: true,
      task: updatedTask,
      message: `Task status updated to ${status}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating task status:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update task status' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
