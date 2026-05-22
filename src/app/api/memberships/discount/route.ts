import { NextRequest, NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/authMiddleware';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyApiAuth(request as unknown as Request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = auth.userId;
    const orgId = request.nextUrl.searchParams.get('org');

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Find the user's club membership for this organization
    const member = await prisma.clubMember.findFirst({
      where: {
        playerId: userId,
        organizationId: orgId,
      },
      include: {
        membershipTier: true,
      },
    });

    // If user is not a member or has no discount, return empty discount
    if (!member || !member.membershipTier) {
      return NextResponse.json({
        discountPercentage: 0,
        membershipName: null,
        isMember: false,
      });
    }

    return NextResponse.json({
      discountPercentage: member.membershipTier.discountPercentage || 0,
      membershipName: member.membershipTier.name,
      isMember: true,
    });
  } catch (error) {
    console.error('Error fetching membership discount:', error);
    return NextResponse.json(
      { error: 'Failed to fetch membership discount' },
      { status: 500 }
    );
  }
}
