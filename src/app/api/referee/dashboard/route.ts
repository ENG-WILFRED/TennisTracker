import { NextRequest, NextResponse } from "next/server";
import { cacheResponse } from "@/lib/apiCache";
import { verifyApiAuth } from "@/lib/authMiddleware";
import prisma from "@/lib/prisma";
import { refereeTaskOrchestrator } from "@/services/referee-task.orchestrator";

/**
 * GET /api/referee/dashboard
 * Get referee's task dashboard
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyApiAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify user is a referee
    const referee = await prisma.referee.findUnique({
      where: { userId: auth.userId },
    });

    if (!referee) {
      return NextResponse.json(
        { error: "Referee access required" },
        { status: 403 }
      );
    }
    
    const dashboard = await cacheResponse(
      `referee-dashboard:${auth.userId}`,
      async () => refereeTaskOrchestrator.getRefereeDashboard(auth.userId),
      10_000
    );

    return NextResponse.json(
      {
        success: true,
        data: dashboard,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=15, stale-while-revalidate=45',
        },
      }
    );
  } catch (error: unknown) {
    console.error("Error fetching referee dashboard:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: message || "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}
