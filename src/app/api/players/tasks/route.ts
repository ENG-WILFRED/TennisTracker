import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/players/tasks?playerId=<playerId>&status=<status>
 * Get all tasks where player is involved (listed in task context)
 * Tasks can be assigned to coaches/referees but involve the player
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const playerId = url.searchParams.get('playerId');
    const status = url.searchParams.get('status'); // Optional: 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', etc.

    if (!playerId) {
      return NextResponse.json({ error: 'playerId required' }, { status: 400 });
    }

    // Build where clause - find tasks where player ID is in context
    const whereClause: any = {
      context: {
        path: ['selectedPlayerIds'],
        array_contains: [playerId],
      },
    };

    if (status) {
      whereClause.status = status;
    }

    // Get all tasks involving this player
    const tasks = await prisma.task.findMany({
      where: whereClause,
      select: {
        id: true,
        templateId: true,
        organizationId: true,
        assignedToId: true,
        assignedById: true,
        status: true,
        context: true,
        dueDate: true,
        startedAt: true,
        completedAt: true,
        rejectionReason: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        template: {
          select: {
            id: true,
            name: true,
            type: true,
            role: true,
            description: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
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
              },
            },
          },
        },
        assignedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' },
      ],
    });

    // Transform tasks to include formatted data
    const formattedTasks = tasks.map(task => {
      const context = typeof task.context === 'string' ? JSON.parse(task.context) : task.context;
      return {
        ...task,
        context,
        assignedToUser: {
          id: task.assignedTo.userId,
          firstName: task.assignedTo.user?.firstName || '',
          lastName: task.assignedTo.user?.lastName || '',
          email: task.assignedTo.user?.email || '',
          photo: task.assignedTo.user?.photo,
        },
      };
    });

    return NextResponse.json({
      tasks: formattedTasks,
      count: formattedTasks.length,
    });
  } catch (error) {
    console.error('Error fetching player tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}
