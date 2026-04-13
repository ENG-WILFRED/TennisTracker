import { NextRequest, NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/authMiddleware";
import { taskNotificationService } from "@/services/task-notification.service";

/**
 * GET /api/notifications/[notificationId]
 * Get status and details of a specific notification
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const auth = verifyApiAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Handled by params promise
    const { notificationId } = await params;

    // This would require a query from NotificationLog table
    // For now, returning placeholder
    return NextResponse.json({
      error: "Endpoint not fully implemented",
    }, { status: 501 });
  } catch (error) {
    console.error("[NotificationDetailEndpoint] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications/[notificationId]/retry
 * Manually retry a failed notification
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const auth = verifyApiAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationId } = await params;

    await taskNotificationService.manualRetry(notificationId);

    return NextResponse.json({
      success: true,
      message: "Notification retry initiated",
    });
  } catch (error: any) {
    console.error("[NotificationRetryManualEndpoint] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retry notification" },
      { status: 500 }
    );
  }
}
