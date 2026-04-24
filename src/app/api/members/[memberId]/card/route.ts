import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { membershipCardService } from '@/services/membershipCardService';
import { MembershipCardData } from '@/utils/generateMembershipCardPDF';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const body = await request.json();
    const { format = 'pdf', organizationId } = body;

    // Get membership details
    const membership = await prisma.membership.findFirst({
      where: {
        userId: memberId,
        ...(organizationId && { orgId: organizationId }),
        status: 'accepted'
      },
      include: {
        user: true,
        organization: true
      }
    }) as any;

    if (!membership) {
      return NextResponse.json(
        { error: 'Membership not found or not approved' },
        { status: 404 }
      );
    }

    // Calculate expiry date (1 year from approval)
    const expiryDate = new Date(membership.approvedAt!);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    // Prepare card data
    const cardData: MembershipCardData = {
      memberName: `${membership.user.firstName} ${membership.user.lastName}`.trim(),
      memberId: membership.userId,
      organizationName: membership.organization.name,
      organizationEmail: membership.organization.email || undefined,
      organizationPhone: membership.organization.phone || undefined,
      role: membership.role,
      status: membership.status,
      accessLevel: 'Standard',
      joinedDate: membership.joinedAt.toISOString().split('T')[0],
      approvedDate: membership.approvedAt!.toISOString().split('T')[0],
      expiryDate: expiryDate.toISOString().split('T')[0],
      qrCodeData: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${memberId}?org=${membership.orgId}`
    };

    // Generate card
    const result = await membershipCardService.generateCard(cardData, {
      format,
      organizationId: membership.orgId
    });

    return NextResponse.json({
      success: true,
      card: result,
      member: {
        id: membership.userId,
        name: cardData.memberName,
        organization: membership.organization.name
      }
    });

  } catch (error) {
    console.error('Card generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate membership card' },
      { status: 500 }
    );
  }
}

// Batch generation endpoint
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { memberIds, organizationId, format = 'pdf' } = body;

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json(
        { error: 'memberIds array is required' },
        { status: 400 }
      );
    }

    // Get all memberships
    const memberships = await prisma.membership.findMany({
      where: {
        userId: { in: memberIds },
        ...(organizationId && { orgId: organizationId }),
        status: 'accepted'
      },
      include: {
        user: true,
        organization: true
      }
    }) as any[];

    // Prepare batch requests
    const cardRequests = memberships.map(membership => {
      const expiryDate = new Date(membership.approvedAt!);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      const cardData: MembershipCardData = {
        memberName: `${membership.user.firstName} ${membership.user.lastName}`.trim(),
        memberId: membership.userId,
        organizationName: membership.organization.name,
        organizationEmail: membership.organization.email || undefined,
        organizationPhone: membership.organization.phone || undefined,
        role: membership.role,
        status: membership.status,
        accessLevel: 'Standard',
        joinedDate: membership.joinedAt.toISOString().split('T')[0],
        approvedDate: membership.approvedAt!.toISOString().split('T')[0],
        expiryDate: expiryDate.toISOString().split('T')[0],
        qrCodeData: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${membership.userId}?org=${membership.orgId}`
      };

      return {
        data: cardData,
        options: { format, organizationId: membership.orgId }
      };
    });

    // Generate batch cards
    const results = await membershipCardService.generateBatchCards(cardRequests, organizationId);

    return NextResponse.json({
      success: true,
      cards: results,
      totalGenerated: results.length,
      totalRequested: memberIds.length
    });

  } catch (error) {
    console.error('Batch card generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate membership cards' },
      { status: 500 }
    );
  }
}