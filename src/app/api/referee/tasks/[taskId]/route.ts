import { NextRequest, NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/authMiddleware";
import { refereeTaskOrchestrator } from "@/services/referee-task.orchestrator";

/**
 * GET /api/referee/tasks/[taskId]
 * Get tournament task details and status
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  try {
    const auth = verifyApiAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const status = await refereeTaskOrchestrator.getTournamentStatus(
      taskId,
      auth.playerId
    );

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error("Error fetching tournament status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch status" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/referee/tasks/[taskId]
 * Update tournament task status (accept, start, complete, reject)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const auth = verifyApiAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { action, payload } = await req.json();

    let result;

    switch (action) {
      case "accept":
        result = await refereeTaskOrchestrator.acceptTournament(
          taskId,
          auth.playerId
        );
        break;
      case "start":
        result = await refereeTaskOrchestrator.startTournament(
          taskId,
          auth.playerId
        );
        break;
      case "complete":
        result = await refereeTaskOrchestrator.completeTournament(
          taskId,
          auth.playerId
        );
        break;
      case "reject":
        result = await refereeTaskOrchestrator.rejectTournament(
          taskId,
          auth.playerId,
          payload?.reason || "Task rejected"
        );
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Tournament task ${action} successful`,
    });
  } catch (error: any) {
    console.error("Error updating tournament task:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update task" },
      { status: 500 }
    );
  }
}
