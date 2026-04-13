import { NextRequest, NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/authMiddleware";
import prisma from "@/lib/prisma";
import { coachTaskOrchestrator } from "@/services/coach-task.orchestrator";

/**
 * GET /api/coach/dashboard
 * Get coach's task dashboard
 */
export async function GET(req: NextRequest) {
  try {
    const auth = verifyApiAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify user is a coach
    const coach = await prisma.staff.findUnique({
      where: { userId: auth.playerId },
    });

    if (!coach || coach.role !== "coach") {
      return NextResponse.json(
        { error: "Coach access required" },
        { status: 403 }
      );
    }
    
    const dashboard = await coachTaskOrchestrator.getCoachDashboard(auth.playerId);

    return NextResponse.json({
      success: true,
      data: dashboard,
    });
  } catch (error: any) {
    console.error("Error fetching coach dashboard:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}
