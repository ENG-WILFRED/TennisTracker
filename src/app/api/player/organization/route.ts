import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/player/organization
 * Get all organizations the player belongs to (as member and as owner)
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

    // Get player details to check if they own an organization
    const player = await prisma.player.findUnique({
      where: { userId: playerId },
      select: { organizationId: true },
    });

    // Find player's club memberships
    const clubMemberships = await prisma.clubMember.findMany({
      where: { playerId },
      select: { organizationId: true },
    });

    const organizationIds = new Set<string>();
    
    // Add club membership organization IDs
    clubMemberships.forEach((member: typeof clubMemberships[number]) => {
      organizationIds.add(member.organizationId);
    });

    // Add owned organization if player owns one
    if (player?.organizationId) {
      organizationIds.add(player.organizationId);
    }

    // If no organizations found, return error
    if (organizationIds.size === 0) {
      return NextResponse.json(
        { error: "Player is not a member of any club and does not own any organization" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      organizationIds: Array.from(organizationIds),
      primaryOrganizationId: player?.organizationId || clubMemberships[0]?.organizationId
    });
  } catch (error: any) {
    console.error("Error fetching organization:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
