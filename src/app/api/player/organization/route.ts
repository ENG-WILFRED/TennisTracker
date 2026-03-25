import { PrismaClient } from "@/generated/prisma";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

/**
 * GET /api/player/organization
 * Get the player's organization (club membership)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const playerId = searchParams.get("playerId");

    if (!playerId) {
      return NextResponse.json(
        { error: "playerId is required" },
        { status: 400 }
      );
    }

    // Find player's club membership
    const clubMember = await prisma.clubMember.findFirst({
      where: { playerId },
      select: { organizationId: true },
    });

    if (!clubMember) {
      return NextResponse.json(
        { error: "Player is not a member of any club" },
        { status: 404 }
      );
    }

    return NextResponse.json({ organizationId: clubMember.organizationId });
  } catch (error: any) {
    console.error("Error fetching organization:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
