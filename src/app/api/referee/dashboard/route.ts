import { NextRequest, NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/authMiddleware";
import prisma from "@/lib/prisma";
import { refereeTaskOrchestrator } from "@/services/referee-task.orchestrator";

/**
 * GET /api/referee/dashboard
 * Get referee's task dashboard
 */
export async function GET(req: NextRequest) {
  try {
    const auth = verifyApiAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify user is a referee
    const referee = await prisma.referee.findUnique({
      where: { userId: auth.playerId },
    });

    if (!referee) {
      return NextResponse.json(
        { error: "Referee access required" },
        { status: 403 }
      );
    }
    
    const dashboard = await refereeTaskOrchestrator.getRefereeDashboard(auth.playerId);

    return NextResponse.json({
      success: true,
      data: dashboard,
    });
  } catch (error: any) {
    console.error("Error fetching referee dashboard:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}
