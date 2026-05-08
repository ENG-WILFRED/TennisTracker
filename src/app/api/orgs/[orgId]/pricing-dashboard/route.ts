import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { coachingSessionPaymentService } from '@/services/coaching-session-payment.service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

/**
 * GET /api/orgs/[orgId]/pricing-dashboard
 * Get all pricing rules for organization dashboard
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Verify user is org admin
    const membership = await prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
    });

    if (!membership || !['admin', 'staff'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only organization admins can access pricing' },
        { status: 403 }
      );
    }

    const pricingRules = await coachingSessionPaymentService.getPricingRules(orgId);

    return NextResponse.json({
      success: true,
      data: pricingRules,
    });
  } catch (error: any) {
    console.error('Error fetching pricing rules:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pricing rules' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orgs/[orgId]/pricing-dashboard
 * Create or update a pricing rule (tier or coach)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Verify user is org admin
    const membership = await prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
    });

    if (!membership || !['admin', 'staff'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only organization admins can manage pricing' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { ruleType, tierName, coachId, pricePerHour, discountPercent, description, reason } = body;

    if (!ruleType || !pricePerHour || pricePerHour <= 0) {
      return NextResponse.json(
        { error: 'Missing required fields or invalid price' },
        { status: 400 }
      );
    }

    let result;

    if (ruleType === 'tier') {
      if (!tierName) {
        return NextResponse.json(
          { error: 'Tier name is required for tier pricing' },
          { status: 400 }
        );
      }

      result = await coachingSessionPaymentService.setTierPricing(
        orgId,
        tierName,
        pricePerHour,
        discountPercent,
        description
      );

      return NextResponse.json({
        success: true,
        data: result,
        message: `Tier pricing for "${tierName}" set to $${pricePerHour}/hour`,
      });
    } else if (ruleType === 'coach') {
      if (!coachId) {
        return NextResponse.json(
          { error: 'Coach ID is required for coach pricing' },
          { status: 400 }
        );
      }

      result = await coachingSessionPaymentService.setCoachPricing(
        orgId,
        coachId,
        pricePerHour,
        tierName,
        description,
        reason
      );

      return NextResponse.json({
        success: true,
        data: result,
        message: `Coach pricing set to $${pricePerHour}/hour${tierName ? ` for ${tierName} tier` : ''}`,
      });
    }

    return NextResponse.json(
      { error: 'Invalid rule type. Use "tier" or "coach"' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error creating pricing rule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create pricing rule' },
      { status: 500 }
    );
  }
}
