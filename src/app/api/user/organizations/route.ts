import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

/**
 * GET /api/user/organizations
 * Get organizations where the user is an owner or member with a role
 */
export async function GET(request: NextRequest) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = auth.playerId;

    // Get organizations where user is owner
    const ownedOrgs = await prisma.organization.findMany({
      where: { createdBy: userId },
      select: {
        id: true,
        name: true,
        createdBy: true,
      },
    });

    // Get organizations where user is a member with a role
    const memberOrgs = await prisma.clubMember.findMany({
      where: { playerId: userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            createdBy: true,
          },
        },
      },
    });

    // Combine results
    const organizations = [
      ...ownedOrgs.map((org) => ({
        organizationId: org.id,
        organizationName: org.name,
        role: 'owner',
      })),
      ...memberOrgs.map((membership) => ({
        organizationId: membership.organizationId,
        organizationName: membership.organization.name,
        role: membership.role || 'member',
      })),
    ];

    // Remove duplicates (in case user is both owner and member)
    const uniqueOrgs = Array.from(
      new Map(
        organizations.map((org) => [org.organizationId, org])
      ).values()
    );

    return NextResponse.json(uniqueOrgs);
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user organizations' },
      { status: 500 }
    );
  }
}
