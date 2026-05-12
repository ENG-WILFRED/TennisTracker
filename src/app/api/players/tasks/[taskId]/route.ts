import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

type RequestType = 'postpone' | 'cancel';
type RequestStatus = 'pending' | 'approved' | 'denied';
type DecisionType = 'occurred' | 'missed';
type DecisionStatus = 'pending' | 'confirmed' | 'rejected';

function parseContext(context: any) {
  if (!context) return {};
  return typeof context === 'string' ? JSON.parse(context) : context;
}

async function enrichTaskContext(context: any) {
  if (!context || typeof context !== 'object') return context;

  const enriched = { ...context };

  if (
    Array.isArray(context.selectedPlayerIds) &&
    !Array.isArray(context.selectedPlayerNames)
  ) {
    const playerIds = context.selectedPlayerIds.filter((id: any) => typeof id === 'string');
    if (playerIds.length > 0) {
      const players = await prisma.user.findMany({
        where: { id: { in: playerIds } },
        select: { id: true, firstName: true, lastName: true },
      });

      enriched.selectedPlayerNames = playerIds.map((id: string) => {
        const player = players.find((user) => user.id === id);
        if (!player) return id;
        return [player.firstName, player.lastName].filter(Boolean).join(' ') || id;
      });
    }
  }

  if (context.courtId && !context.courtName) {
    const court = await prisma.court.findUnique({
      where: { id: context.courtId },
      select: { name: true },
    });
    if (court?.name) {
      enriched.courtName = court.name;
    }
  }

  return enriched;
}

function appendNote(base: string | null | undefined, note: string) {
  return base ? `${base}\n\n${note}` : note;
}

function buildDecisionContext(currentContext: any, actor: 'player' | 'coach', decision: DecisionType) {
  const decisionKey = actor === 'player' ? 'playerDecision' : 'coachDecision';
  return {
    ...currentContext,
    [decisionKey]: {
      ...currentContext[decisionKey],
      decision,
      status: 'pending',
      actedAt: new Date().toISOString(),
    },
  };
}

function finalizeMatchedDecision(currentContext: any, decision: DecisionType) {
  const playerDecision = currentContext.playerDecision;
  const coachDecision = currentContext.coachDecision;

  if (!playerDecision || !coachDecision) return null;
  if (playerDecision.decision !== coachDecision.decision) return null;
  if (playerDecision.decision !== decision || coachDecision.decision !== decision) return null;

  return decision === 'occurred' ? 'COMPLETED' : 'FAILED';
}

function buildResponseContext(currentContext: any, decision: 'approved' | 'denied') {
  return {
    ...currentContext,
    coachRequest: {
      ...currentContext.coachRequest,
      status: decision,
      actedAt: new Date().toISOString(),
    },
  };
}

/**
 * GET /api/players/tasks/[taskId]?playerId=<playerId>
 * Get a specific task where player is involved
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const url = new URL(req.url);
    const playerId = url.searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json({ error: 'playerId required' }, { status: 400 });
    }

    if (!taskId) {
      return NextResponse.json({ error: 'taskId required' }, { status: 400 });
    }

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        context: {
          path: ['selectedPlayerIds'],
          array_contains: [playerId],
        },
      },
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
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const context = await enrichTaskContext(parseContext(task.context));
    const formattedTask = {
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

    return NextResponse.json({ task: formattedTask });
  } catch (error) {
    console.error('Error fetching player task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const url = new URL(req.url);
    const playerId = url.searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json({ error: 'playerId required' }, { status: 400 });
    }

    if (!taskId) {
      return NextResponse.json({ error: 'taskId required' }, { status: 400 });
    }

    const body = await req.json();
    const { action, payload } = body;

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        context: {
          path: ['selectedPlayerIds'],
          array_contains: [playerId],
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    let updatedTask;
    const currentContext = parseContext(task.context);
    const now = new Date();

    if (action === 'occurred' || action === 'missed') {
      const decision = action as DecisionType;
      const nextContext = buildDecisionContext(currentContext, 'player', decision);
      const coachDecision = currentContext.coachDecision;
      const notes = appendNote(
        task.notes,
        `Player requested this task be marked as ${decision}. Waiting for coach confirmation.`
      );
      const updateData: any = {
        notes,
        context: nextContext,
      };

      if (coachDecision?.decision === decision) {
        updateData.status = decision === 'occurred' ? 'COMPLETED' : 'FAILED';
        if (decision === 'occurred') {
          updateData.completedAt = now;
        }
        if (decision === 'missed') {
          updateData.rejectionReason = appendNote(
            task.rejectionReason,
            'Player and coach agreed the task was missed.'
          );
        }
        nextContext.playerDecision.status = 'confirmed';
        nextContext.coachDecision = {
          ...coachDecision,
          status: 'confirmed',
          actedAt: coachDecision.actedAt || now.toISOString(),
        };
      }

      updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: updateData,
      });
    } else if (action === 'request') {
      const requestType = payload?.requestType as RequestType;
      const reason = payload?.reason?.trim();

      if (!['postpone', 'cancel'].includes(requestType)) {
        return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
      }

      if (!reason) {
        return NextResponse.json({ error: 'Request reason required' }, { status: 400 });
      }

      updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          notes: appendNote(task.notes, `Player requested to ${requestType}: ${reason}`),
          context: {
            ...currentContext,
            playerRequest: {
              requestType,
              reason,
              status: 'pending',
              requestedAt: now.toISOString(),
            },
          },
        },
      });
    } else if (action === 'respond_request') {
      const decision = payload?.decision;

      if (!['approved', 'denied'].includes(decision)) {
        return NextResponse.json({ error: 'Invalid request response' }, { status: 400 });
      }

      if (!currentContext.coachRequest) {
        return NextResponse.json({ error: 'No coach request to respond to' }, { status: 400 });
      }

      const nextContext = buildResponseContext(currentContext, decision);
      const notes = appendNote(
        task.notes,
        decision === 'approved'
          ? `Player approved coach request to ${currentContext.coachRequest.requestType}.`
          : `Player denied coach request to ${currentContext.coachRequest.requestType}.`
      );
      const updateData: any = {
        notes,
        context: nextContext,
      };

      if (decision === 'approved' && currentContext.coachRequest.requestType === 'cancel') {
        updateData.status = 'CANCELLED';
      }

      updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: updateData,
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const transformed = {
      ...updatedTask,
      context: await enrichTaskContext(
        typeof updatedTask.context === 'string'
          ? JSON.parse(updatedTask.context)
          : updatedTask.context
      ),
    };

    return NextResponse.json({ task: transformed });
  } catch (error) {
    console.error('Error updating player task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}
