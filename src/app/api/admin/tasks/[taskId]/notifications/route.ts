import { NextRequest, NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/authMiddleware";
import { taskNotificationService } from "@/services/task-notification.service";

/**
 * GET /api/admin/tasks/[taskId]/notifications
 * Get all notification statuses for a task
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const auth = verifyApiAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;

    const notifications =
      await taskNotificationService.getTaskNotificationStatus(taskId);

    // Compute summary stats
    const summary = {
      total: notifications.length,
      sent: notifications.filter((n) => n.status === "SENT").length,
      failed: notifications.filter((n) => n.status === "FAILED").length,
      pending: notifications.filter((n) => n.status === "PENDING").length,
      delivered: notifications.filter((n) => n.status === "DELIVERED").length,
    };

    return NextResponse.json({
      success: true,
      data: notifications,
      summary,
    });
  } catch (error) {
    console.error("[TaskNotificationsEndpoint] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch task notifications" },
      { status: 500 }
    );
  }
}
