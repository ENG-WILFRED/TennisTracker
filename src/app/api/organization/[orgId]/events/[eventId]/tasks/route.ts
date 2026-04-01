import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string; eventId: string }> }
) {
  try {
    const { orgId, eventId } = await params;

    const tasks = await prisma.eventTask.findMany({
      where: {
        eventId,
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
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            provider: {
              select: {
                id: true,
                businessName: true,
              }
            }
          }
        },
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    const formattedTasks = tasks.map(task => ({
      id: task.id,
      eventId: task.eventId,
      serviceId: task.serviceId,
      staffUserId: task.staffUserId,
      title: task.title,
      description: task.description,
      role: task.role,
      responsibility: task.responsibility,
      status: task.status,
      priority: task.priority,
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
      service: task.service ? {
        id: task.service.id,
        name: task.service.name,
        category: task.service.category,
        provider: task.service.provider ? {
          id: task.service.provider.id,
          businessName: task.service.provider.businessName,
        } : null,
      } : null,
    }));

    return new Response(JSON.stringify(formattedTasks), {
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
  { params }: { params: Promise<{ orgId: string; eventId: string }> }
) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { orgId, eventId } = await params;
    const body = await request.json();
    const { 
      staffUserId, 
      serviceId, 
      title, 
      description, 
      role, 
      responsibility, 
      priority = 'medium',
      dueDate 
    } = body as any;

    if (!title || (!staffUserId && !serviceId)) {
      return new Response(
        JSON.stringify({ error: 'title and either staffUserId or serviceId required' }), 
        { status: 400 }
      );
    }

    // Verify event exists
    const event = await prisma.clubEvent.findUnique({
      where: { id: eventId },
      select: { id: true }
    });

    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 });
    }

    const task = await prisma.eventTask.create({
      data: {
        eventId,
        organizationId: orgId,
        staffUserId: staffUserId || null,
        serviceId: serviceId || null,
        title,
        description: description || null,
        role: role || 'Staff',
        responsibility: responsibility || null,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'pending',
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
        service: {
          select: {
            id: true,
            name: true,
            category: true,
          }
        },
      },
    });

    return new Response(JSON.stringify(task), {
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ orgId: string; eventId: string }> }
) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { orgId, eventId } = await params;
    const body = await request.json();
    const { 
      taskId, 
      status, 
      notes, 
      completedBy,
      priority,
      dueDate 
    } = body as any;

    if (!taskId) {
      return new Response(JSON.stringify({ error: 'taskId required' }), { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (priority) updateData.priority = priority;
    if (dueDate) updateData.dueDate = new Date(dueDate);
    
    if (status === 'completed') {
      updateData.completedAt = new Date();
      if (completedBy) {
        updateData.completedBy = completedBy;
      }
    }

    const task = await prisma.eventTask.update({
      where: { id: taskId },
      data: updateData,
      include: {
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
      },
    });

    return new Response(JSON.stringify(task), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return new Response(JSON.stringify({ error: 'Failed to update task' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ orgId: string; eventId: string }> }
) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { orgId, eventId } = await params;
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return new Response(JSON.stringify({ error: 'taskId required' }), { status: 400 });
    }

    await prisma.eventTask.delete({
      where: { id: taskId }
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete task' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
