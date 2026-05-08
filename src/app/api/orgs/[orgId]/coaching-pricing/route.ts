import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { coachingSessionPaymentService } from '@/services/coaching-session-payment.service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

/**
 * GET /api/orgs/[orgId]/coaching-pricing
 * Get organization's coaching session pricing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  try {
    const pricing = await prisma.orgCoachingPricing.findUnique({
      where: { organizationId: orgId },
    });

    return NextResponse.json({
      success: true,
      data: pricing || {
        organizationId: orgId,
        message: 'No pricing configured yet',
      },
    });
  } catch (error: any) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pricing' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orgs/[orgId]/coaching-pricing
 * Set/update organization's coaching session pricing
 * Only organization admins can do this
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
    // Verify user is org admin/manager
    const membership = await prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId: userId,
          orgId,
        },
      },
    });

    if (!membership || !['admin', 'staff'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only organization admins can configure pricing' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { pricePerHour, currency, minSessionDurationMinutes, roundingType } = body;

    if (!pricePerHour || pricePerHour <= 0) {
      return NextResponse.json(
        { error: 'Price per hour must be greater than 0' },
        { status: 400 }
      );
    }

    const pricing = await prisma.orgCoachingPricing.upsert({
      where: { organizationId: orgId },
      create: {
        organizationId: orgId,
        pricePerHour,
        currency: currency || 'USD',
        minSessionDurationMinutes: minSessionDurationMinutes || 30,
        roundingType: roundingType || 'up',
      },
      update: {
        pricePerHour,
        currency: currency || undefined,
        minSessionDurationMinutes: minSessionDurationMinutes || undefined,
        roundingType: roundingType || undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: pricing,
      message: `Coaching pricing set to $${pricePerHour}/hour`,
    });
  } catch (error: any) {
    console.error('Error setting pricing:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set pricing' },
      { status: 500 }
    );
  }
}
