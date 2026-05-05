import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { coachingSessionPaymentService } from '@/services/coaching-session-payment.service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

/**
 * DELETE /api/orgs/[orgId]/pricing-dashboard/[ruleId]
 * Deactivate a pricing rule
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; ruleId: string }> }
) {
  const { orgId, ruleId } = await params;
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

    if (!membership || !['admin', 'finance_officer'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only organization admins can delete pricing rules' },
        { status: 403 }
      );
    }

    const query = await request.nextUrl.searchParams;
    const ruleType = query.get('type') as 'tier' | 'coach' | null;

    if (!ruleType || !['tier', 'coach'].includes(ruleType)) {
      return NextResponse.json(
        { error: 'Rule type (tier or coach) is required' },
        { status: 400 }
      );
    }

    const result = await coachingSessionPaymentService.deactivatePricingRule(ruleType, ruleId);

    return NextResponse.json({
      success: true,
      data: result,
      message: `${ruleType} pricing rule deactivated`,
    });
  } catch (error: any) {
    console.error('Error deleting pricing rule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete pricing rule' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orgs/[orgId]/pricing-dashboard/[ruleId]
 * Update a pricing rule
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; ruleId: string }> }
) {
  const { orgId, ruleId } = await params;
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

    if (!membership || !['admin', 'finance_officer'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only organization admins can update pricing rules' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { ruleType, pricePerHour, description, reason, discountPercent, isActive } = body;

    if (!ruleType || !['tier', 'coach'].includes(ruleType)) {
      return NextResponse.json(
        { error: 'Invalid rule type' },
        { status: 400 }
      );
    }

    let result;

    if (ruleType === 'tier') {
      result = await prisma.tierCoachingPrice.update({
        where: { id: ruleId },
        data: {
          ...(pricePerHour && { pricePerHour }),
          ...(description && { description }),
          ...(typeof discountPercent === 'number' && { discountPercent }),
          ...(typeof isActive === 'boolean' && { isActive }),
          updatedAt: new Date(),
        },
      });
    } else {
      result = await prisma.coachSpecificPrice.update({
        where: { id: ruleId },
        data: {
          ...(pricePerHour && { pricePerHour }),
          ...(description && { description }),
          ...(reason && { reason }),
          ...(typeof isActive === 'boolean' && { isActive }),
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `${ruleType} pricing rule updated`,
    });
  } catch (error: any) {
    console.error('Error updating pricing rule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update pricing rule' },
      { status: 500 }
    );
  }
}
