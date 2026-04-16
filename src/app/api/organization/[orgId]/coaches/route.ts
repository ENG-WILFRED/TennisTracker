import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyApiAuth } from "@/lib/authMiddleware";

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60 * 1000; // 1 minute in milliseconds

interface CachedCoach {
  id: string;
  userId: string;
  name: string;
  email: string;
  photo?: string;
  bio?: string;
  organizationId: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const authResult = verifyApiAuth(req);
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await params;
    const cacheKey = `coaches:${orgId}`;

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`📦 Cache hit for coaches in org ${orgId}`);
      return NextResponse.json(cached.data);
    }

    // Fetch coaches from database
    const staff = await prisma.staff.findMany({
      where: {
        organizationId: orgId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            photo: true,
            bio: true,
          },
        },
      },
    });

    // Format response
    const coaches: CachedCoach[] = staff.map((s: typeof staff[number]) => ({
      id: s.userId,
      userId: s.userId,
      name: `${s.user.firstName || ""} ${s.user.lastName || ""}`.trim(),
      email: s.user.email,
      photo: s.user.photo || undefined,
      bio: s.user.bio || undefined,
      organizationId: s.organizationId || "",
    }));

    const response = { coaches, count: coaches.length };

    // Cache the result
    cache.set(cacheKey, { data: response, timestamp: Date.now() });
    console.log(
      `✅ Fetched and cached ${coaches.length} coaches for org ${orgId}`
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching coaches:", error);
    return NextResponse.json(
      { error: "Failed to fetch coaches" },
      { status: 500 }
    );
  }
}

/**
 * Clear cache for organization
 * Useful after coach modifications
 */
function clearCoachesCache(organizationId: string) {
  cache.delete(`coaches:${organizationId}`);
  console.log(`🗑️  Cleared coaches cache for org ${organizationId}`);
}
