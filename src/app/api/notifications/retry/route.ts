import { NextRequest, NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/authMiddleware";
import { taskNotificationService } from "@/services/task-notification.service";

/**
 * POST /api/notifications/retry
 * Process pending notifications and retry failed ones
 * Can be called by a cron job or manually
 */
export async function POST(req: NextRequest) {
  try {
    const auth = verifyApiAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Process retries
    await taskNotificationService.processRetries();

    return NextResponse.json({
      success: true,
      message: "Notification retries processed",
    });
  } catch (error) {
    console.error("[NotificationRetryEndpoint] Error:", error);
    return NextResponse.json(
      { error: "Failed to process retries" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/retry
 * Get status of failed notifications
 */
export async function GET(req: NextRequest) {
  try {
    const auth = verifyApiAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const failedNotifications =
      await taskNotificationService.getFailedNotifications(limit);

    return NextResponse.json({
      success: true,
      data: failedNotifications,
      count: failedNotifications.length,
    });
  } catch (error) {
    console.error("[NotificationGetEndpoint] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
