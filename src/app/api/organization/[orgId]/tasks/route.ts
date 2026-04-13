import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';
import { broadcastToUser } from '@/lib/websocket-broadcast';

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
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    
    // Get pagination parameters from query
    const url = new URL(request.url);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    console.log(`📋 Fetching tasks for org: ${orgId}, offset: ${offset}, limit: ${limit}`);

    // Get total count of tasks from BOTH Task and EventTask models
    const typedTaskCount = await prisma.task.count({
      where: {
        organizationId: orgId,
      }
    });

    const eventTaskCount = await prisma.eventTask.count({
      where: {
        organizationId: orgId,
      }
    });

    console.log(`Found ${typedTaskCount} typed tasks and ${eventTaskCount} event tasks`);

    const totalCount = typedTaskCount + eventTaskCount;

    // Fetch typed tasks (from new Task model)
    const typedTasks = await prisma.task.findMany({
      where: {
        organizationId: orgId,
      },
      include: {
        template: {
          select: {
            name: true,
            type: true,
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
                photo: true,
              }
            },
            role: true,
            expertise: true,
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
        { createdAt: 'desc' }
      ],
      skip: offset,
      take: limit,
    });

    // Fetch event tasks as fallback (legacy model)
    const eventTasks = await prisma.eventTask.findMany({
      where: {
        organizationId: orgId,
      },
      include: {
        assignedTo: {
          select: {
            userId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                photo: true,
              }
            },
            role: true,
            expertise: true,
          }
        },
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' }
      ],
      skip: Math.max(0, offset - typedTaskCount),
      take: Math.max(0, limit - typedTasks.length),
    });

    // Format typed tasks
    const formattedTypedTasks = typedTasks.map(task => ({
      id: task.id,
      eventId: undefined,
      staffUserId: task.assignedToId,
      title: task.template?.name || 'Task',
      description: task.notes,
      role: task.template?.type || 'Task',
      responsibility: undefined,
      // Map TaskStatus enum to UI status values
      status: mapTaskStatus(task.status),
      priority: 'medium',
      rejectionReason: task.rejectionReason,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      completedBy: undefined,
      notes: task.notes,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      assignedTo: task.assignedTo ? {
        id: task.assignedTo.userId,
        name: `${task.assignedTo.user.firstName} ${task.assignedTo.user.lastName}`,
        email: task.assignedTo.user.email,
        photo: task.assignedTo.user.photo,
        role: task.assignedTo.role,
        expertise: task.assignedTo.expertise,
      } : null,
      event: null,
      context: task.context, // Include context with player info
      templateId: task.templateId,
      assignedBy: task.assignedBy ? `${task.assignedBy.firstName} ${task.assignedBy.lastName}` : null,
    }));

    // Format event tasks
    const formattedEventTasks = eventTasks.map(task => ({
      id: task.id,
      eventId: task.eventId,
      staffUserId: task.staffUserId,
      title: task.title,
      description: task.description,
      role: task.role,
      responsibility: task.responsibility,
      status: task.status,
      priority: task.priority,
      rejectionReason: task.rejectionReason,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      completedBy: task.completedBy,
      notes: task.notes,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      assignedTo: task.assignedTo ? {
        id: task.assignedTo.userId,
        name: `${task.assignedTo.user.firstName} ${task.assignedTo.user.lastName}`,
        email: task.assignedTo.user.email,
        photo: task.assignedTo.user.photo,
        role: task.assignedTo.role,
        expertise: task.assignedTo.expertise,
      } : null,
      event: null,
    }));

    // Combine and sort by date
    const allTasks = [...formattedTypedTasks, ...formattedEventTasks]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    console.log(`✅ Returning ${allTasks.length} tasks (${formattedTypedTasks.length} typed, ${formattedEventTasks.length} event)`);

    return new Response(JSON.stringify({
      tasks: allTasks,
      total: totalCount,
      offset,
      limit
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch tasks' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { orgId } = await params;
    const body = await request.json();
    const { 
      staffUserId, 
      title, 
      description, 
      role, 
      responsibility, 
      priority = 'medium',
      dueDate,
      eventId,
    } = body as any;

    if (!title || !staffUserId) {
      return new Response(
        JSON.stringify({ error: 'title and staffUserId required' }), 
        { status: 400 }
      );
    }

    // Validate staff member exists
    const staffExists = await prisma.staff.findFirst({
      where: {
        userId: staffUserId,
        organizationId: orgId,
      },
      select: { userId: true, user: { select: { firstName: true, lastName: true, email: true } } }
    });

    if (!staffExists) {
      return new Response(JSON.stringify({ error: 'Staff member not found in organization' }), { status: 404 });
    }

    // Create task
    const createData = {
      staffUserId,
      organizationId: orgId,
      title,
      description,
      role: role || 'Staff',
      responsibility,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: 'pending' as const,
      ...(eventId && { eventId }),
    };

    const task = await prisma.eventTask.create({
      data: createData,
      select: {
        id: true,
        eventId: true,
        staffUserId: true,
        organizationId: true,
        title: true,
        description: true,
        role: true,
        responsibility: true,
        priority: true,
        dueDate: true,
        completedAt: true,
        completedBy: true,
        notes: true,
        rejectionReason: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        assignedTo: {
          select: {
            userId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                photo: true,
              }
            },
            role: true,
          }
        },
      },
    });

    // Broadcast task assignment via WebSocket
    broadcastToUser(staffUserId, {
      type: 'task-assigned',
      data: {
        taskId: task.id,
        title: task.title,
        role: task.role,
        priority: task.priority,
        description: task.description,
        dueDate: task.dueDate,
        timestamp: new Date().toISOString(),
      }
    });

    // Send DM notification with task details and action links
    try {
      // Get current user (person assigning the task) for DM creation
      const createdByEmail = auth?.email || 'system@vico.local';
      
      // Create or get DM room
      const dmRes = await fetch(new URL('/api/chat/dm', request.url).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
        },
        body: JSON.stringify({
          targetUserEmail: staffExists.user.email,
        })
      });

      if (dmRes.ok) {
        const dmRoom = await dmRes.json();
        
        // Send task notification message with accept/reject action prompt
        const taskMessage = `📋 **New Task Assigned**\n\n**Task:** ${title}\n**Role:** ${role}\n**Priority:** ${priority}${responsibility ? `\n**Details:** ${responsibility}` : ''}${dueDate ? `\n**Due:** ${new Date(dueDate).toLocaleDateString()}` : ''}\n\n✅ Accept or ❌ Reject this task in your dashboard.`;
        
        await fetch(new URL(`/api/chat/rooms/${dmRoom.id}/messages`, request.url).toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || '',
          },
          body: JSON.stringify({
            content: taskMessage
          })
        });
      }
    } catch (err) {
      console.error('Failed to send DM notification:', err);
      // Don't fail the entire request if DM fails
    }

    const formattedTask = {
      id: task.id,
      eventId: task.eventId,
      staffUserId: task.staffUserId,
      title: task.title,
      description: task.description,
      role: task.role,
      responsibility: task.responsibility,
      status: task.status,
      priority: task.priority,
      rejectionReason: task.rejectionReason,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      completedBy: task.completedBy,
      notes: task.notes,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      assignedTo: task.assignedTo ? {
        id: task.assignedTo.userId,
        name: `${task.assignedTo.user.firstName} ${task.assignedTo.user.lastName}`,
        email: task.assignedTo.user.email,
        photo: task.assignedTo.user.photo,
        role: task.assignedTo.role,
      } : null,
      event: null, // Event can be fetched separately if needed
    };

    return new Response(JSON.stringify(formattedTask), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return new Response(JSON.stringify({ error: 'Failed to create task' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
