import { NextRequest, NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/authMiddleware";
import { taskLifecycleService } from "@/services/task-lifecycle.service";
import { AssignTaskPayload } from "@/types/task-system";

/**
 * POST /api/admin/tasks/assign
 * Assign a task to a user
 */
export async function POST(req: NextRequest) {
  try {
    const auth = verifyApiAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload: {
      organizationId: string;
      assignmentPayload: AssignTaskPayload;
    } = await req.json();

    if (!payload.organizationId || !payload.assignmentPayload) {
      return NextResponse.json(
        { error: "organizationId and assignmentPayload required" },
        { status: 400 }
      );
    }

    // Verify user is admin of organization
    // TODO: Add role verification

    const task = await taskLifecycleService.assignTask(
      payload.organizationId,
      auth.playerId,
      payload.assignmentPayload
    );

    console.log(`✅ Task created successfully: ${task.id} for org ${payload.organizationId}`);

    return NextResponse.json({
      success: true,
      data: task,
      message: "Task assigned successfully",
    });
  } catch (error: any) {
    console.error(`❌ Error assigning task:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to assign task" },
      { status: 500 }
    );
  }
}
