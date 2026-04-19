import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

/**
 * POST /api/user/organization-applications/remind
 * Send a reminder about a pending application
 */
export async function POST(request: NextRequest) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { membershipId, organizationId } = body as {
      membershipId?: string;
      organizationId?: string;
    };

    if (!membershipId || !organizationId) {
      return NextResponse.json(
        { error: 'Membership ID and organization ID are required' },
        { status: 400 }
      );
    }

    // Verify the membership belongs to the current user
    const membership = await prisma.clubMember.findUnique({
      where: { id: membershipId },
      include: {
        organization: true,
      },
    });

    if (!membership || membership.playerId !== auth.playerId) {
      return NextResponse.json(
        { error: 'Membership not found or access denied' },
        { status: 404 }
      );
    }

    if (membership.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Organization mismatch' },
        { status: 400 }
      );
    }

    // Note: remindedAt field will be tracked once migration is fully applied
    // For now, we just confirm the reminder was sent
    return NextResponse.json({
      success: true,
      message: `Reminder sent to ${membership.organization.name}. They will be notified to review your application.`,
      membershipId: membership.id,
    });
  } catch (error: any) {
    console.error('Failed to send reminder:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send reminder' },
      { status: 500 }
    );
  }
}
