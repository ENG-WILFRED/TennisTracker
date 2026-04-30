import { NextRequest, NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/authMiddleware";
import { taskSubmissionService } from "@/services/task-submission.service";

/**
 * GET /api/submissions/pending
 * Get pending submissions for review (admin/reviewer)
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyApiAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId required" },
        { status: 400 }
      );
    }

    // TODO: Verify user is admin of organization

    const submissions = await taskSubmissionService.getPendingSubmissions(
      organizationId
    );

    return NextResponse.json({
      success: true,
      data: submissions,
      count: submissions.length,
    });
  } catch (error: any) {
    console.error("Error fetching pending submissions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
