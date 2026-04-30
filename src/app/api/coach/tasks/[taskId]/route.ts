import { NextRequest, NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/authMiddleware";
import { coachTaskOrchestrator } from "@/services/coach-task.orchestrator";
import { taskLifecycleService } from "@/services/task-lifecycle.service";

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

    return NextResponse.json({
      success: true,
      data: task,
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

    switch (action) {
      case "accept":
        task = await coachTaskOrchestrator.acceptTask(taskId, auth.userId);
        break;
      case "start":
        task = await coachTaskOrchestrator.startWork(taskId, auth.userId);
        break;
      case "submit":
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
      case "complete":
        task = await taskLifecycleService.completeTask(taskId, auth.userId);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: task,
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
