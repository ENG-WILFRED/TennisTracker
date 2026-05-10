import { NextRequest, NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/authMiddleware";
import { coachTaskOrchestrator } from "@/services/coach-task.orchestrator";
import { taskLifecycleService } from "@/services/task-lifecycle.service";
import prisma from "@/lib/prisma";

function parseContext(context: any) {
  if (!context) return {};
  return typeof context === "string" ? JSON.parse(context) : context;
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

function buildDecisionContext(currentContext: any, actor: 'player' | 'coach', decision: 'occurred' | 'missed') {
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

function buildResponseContext(currentContext: any, decision: 'approved' | 'denied') {
  return {
    ...currentContext,
    playerRequest: {
      ...currentContext.playerRequest,
      status: decision,
      actedAt: new Date().toISOString(),
    },
  };
}

/**
 * GET /api/coach/tasks/[taskId]
 * Get task details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const auth = await verifyApiAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const task = await coachTaskOrchestrator.getTaskDetails(taskId, auth.userId);
    const context = await enrichTaskContext(parseContext(task.context));

    return NextResponse.json({
      success: true,
      data: {
        ...task,
        context,
      },
    });
  } catch (error: any) {
    console.error("Error fetching task details:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch task" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/coach/tasks/[taskId]
 * Update task status (accept, start, submit, etc.)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  try {
    const auth = await verifyApiAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { action, payload } = await req.json();

    let task;
    let updatedTask;

    switch (action) {
      case "accept":
        task = await coachTaskOrchestrator.acceptTask(taskId, auth.userId);
        updatedTask = task;
        break;
      case "start":
        task = await coachTaskOrchestrator.startWork(taskId, auth.userId);
        updatedTask = task;
        break;
      case "submit": {
        const submission = await coachTaskOrchestrator.submitWork(
          taskId,
          auth.userId,
          payload
        );
        return NextResponse.json({
          success: true,
          data: submission,
          message: "Work submitted for review",
        });
      }
      case "complete":
        task = await taskLifecycleService.completeTask(taskId, auth.userId);
        updatedTask = task;
        break;
      case "occurred":
      case "missed": {
        const decision = action as 'occurred' | 'missed';
        const taskRecord = await prisma.task.findUnique({ where: { id: taskId } });
        if (!taskRecord) {
          return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }
        const currentContext = parseContext(taskRecord.context);
        const nextContext = buildDecisionContext(currentContext, 'coach', decision);
        const coachDecision = currentContext.coachDecision;
        const notes = appendNote(
          taskRecord.notes,
          `Coach requested this task be marked as ${decision}. Waiting for player confirmation.`
        );
        const updateData: any = {
          notes,
          context: nextContext,
        };

        if (currentContext.playerDecision?.decision === decision) {
          updateData.status = decision === 'occurred' ? 'COMPLETED' : 'FAILED';
          if (decision === 'occurred') {
            updateData.completedAt = new Date();
          }
          if (decision === 'missed') {
            updateData.rejectionReason = appendNote(
              taskRecord.rejectionReason,
              'Coach and player agreed the task was missed.'
            );
          }
          nextContext.coachDecision.status = 'confirmed';
          nextContext.playerDecision = {
            ...currentContext.playerDecision,
            status: 'confirmed',
            actedAt: currentContext.playerDecision?.actedAt || new Date().toISOString(),
          };
        }

        updatedTask = await prisma.task.update({
          where: { id: taskId },
          data: updateData,
        });
        break;
      }
      case "request": {
        const requestType = payload?.requestType;
        const reason = payload?.reason?.trim();

        if (!['postpone', 'cancel'].includes(requestType)) {
          return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
        }

        if (!reason) {
          return NextResponse.json({ error: 'Request reason required' }, { status: 400 });
        }

        task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

        const currentContext = parseContext(task.context);
        updatedTask = await prisma.task.update({
          where: { id: taskId },
          data: {
            notes: appendNote(task.notes, `Coach requested to ${requestType}: ${reason}`),
            context: {
              ...currentContext,
              coachRequest: {
                requestType,
                reason,
                status: 'pending',
                requestedAt: new Date().toISOString(),
              },
            },
          },
        });
        break;
      }
      case "respond_request": {
        const decision = payload?.decision;
        if (!['approved', 'denied'].includes(decision)) {
          return NextResponse.json({ error: 'Invalid request response' }, { status: 400 });
        }

        task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

        const currentContext = parseContext(task.context);
        if (!currentContext.playerRequest) {
          return NextResponse.json({ error: 'No player request to respond to' }, { status: 400 });
        }

        const nextContext = buildResponseContext(currentContext, decision as 'approved' | 'denied');
        const notes = appendNote(
          task.notes,
          decision === 'approved'
            ? `Coach approved player request to ${currentContext.playerRequest.requestType}.`
            : `Coach denied player request to ${currentContext.playerRequest.requestType}.`
        );
        const updateData: any = {
          notes,
          context: nextContext,
        };

        if (decision === 'approved' && currentContext.playerRequest.requestType === 'cancel') {
          updateData.status = 'CANCELLED';
        }

        updatedTask = await prisma.task.update({
          where: { id: taskId },
          data: updateData,
        });
        break;
      }
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    const responseTask = {
      ...updatedTask,
      context: await enrichTaskContext(
        typeof updatedTask?.context === 'string'
          ? JSON.parse(updatedTask.context)
          : updatedTask?.context
      ),
    };

    return NextResponse.json({
      success: true,
      data: responseTask,
      message: `Task ${action} successful`,
    });
  } catch (error: any) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update task" },
      { status: 500 }
    );
  }
}
