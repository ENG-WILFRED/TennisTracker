import { NextRequest, NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/authMiddleware";
import { taskSubmissionService } from "@/services/task-submission.service";
import { ReviewSubmissionPayload } from "@/types/task-system";

/**
 * GET /api/submissions/[submissionId]
 * Get submission details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params;
    const auth = verifyApiAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const submission = await taskSubmissionService.getSubmission(submissionId);

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: submission,
    });
  } catch (error: any) {
    console.error("Error fetching submission:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch submission" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/submissions/[submissionId]
 * Review/update submission status
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params;
    const auth = verifyApiAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload: ReviewSubmissionPayload = await req.json();

    // TODO: Verify user is admin or reviewer

    const submission = await taskSubmissionService.reviewSubmission(
      submissionId,
      auth.playerId,
      payload
    );

    return NextResponse.json({
      success: true,
      data: submission,
      message: "Submission reviewed successfully",
    });
  } catch (error: any) {
    console.error("Error reviewing submission:", error);
    return NextResponse.json(
      { error: error.message || "Failed to review submission" },
      { status: 500 }
    );
  }
}
