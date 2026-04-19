import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

/**
 * GET /api/user/organization-applications
 * Get all organization applications for the current user
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

    // Get all club memberships for the user (these are the applications)
    const applications = await prisma.clubMember.findMany({
      where: { playerId: userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { joinDate: 'desc' },
    });

    const result = applications.map((app) => ({
      id: app.id,
      userId: userId,
      organizationId: app.organizationId,
      organizationName: app.organization.name,
      position: app.role,
      status: app.paymentStatus === 'pending' ? 'pending' : 'approved',
      appliedAt: app.joinDate.toISOString(),
      reviewedAt: app.joinDate.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to fetch organization applications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}
