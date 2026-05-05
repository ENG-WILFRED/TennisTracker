import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';
import { CoachingSessionPaymentService } from '@/services/coaching-session-payment.service';

function calculateDurationHours(startTime: Date, endTime: Date, roundingType: string = 'up') {
  const durationMs = endTime.getTime() - startTime.getTime();
  if (durationMs <= 0) return 0;
  const durationMinutes = Math.ceil(durationMs / (1000 * 60));
  const durationHours = durationMinutes / 60;

  switch (roundingType) {
    case 'down':
      return Math.floor(durationHours * 4) / 4;
    case 'nearest':
      return Math.round(durationHours * 4) / 4;
    case 'up':
    default:
      return Math.ceil(durationHours * 4) / 4;
  }
}

export async function GET(request: NextRequest) {
  const auth = await verifyApiAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const coachId = url.searchParams.get('coachId');
  const playerId = url.searchParams.get('playerId');
  const startTime = url.searchParams.get('startTime');
  const endTime = url.searchParams.get('endTime');

  if (!coachId || !playerId || !startTime || !endTime) {
    return NextResponse.json({ error: 'coachId, playerId, startTime, and endTime are required' }, { status: 400 });
  }

  if (auth.userId !== coachId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const coach = await prisma.staff.findUnique({
      where: { userId: coachId },
      select: { organizationId: true },
    });

    if (!coach?.organizationId) {
      return NextResponse.json({ error: 'Coach organization not found' }, { status: 404 });
    }

    const service = new CoachingSessionPaymentService();
    const pricingRule = await service.determinePricingRule(coachId, playerId, coach.organizationId);
    const orgPricing = await prisma.orgCoachingPricing.findUnique({
      where: { organizationId: coach.organizationId },
    });

    if (!orgPricing) {
      return NextResponse.json({ error: 'Organization coaching pricing not configured' }, { status: 404 });
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate <= startDate) {
      return NextResponse.json({ error: 'Invalid startTime or endTime' }, { status: 400 });
    }

    const durationHours = calculateDurationHours(startDate, endDate, orgPricing.roundingType);
    const estimatedPrice = durationHours * pricingRule.pricePerHour;

    return NextResponse.json({
      estimatedPrice: Number(estimatedPrice.toFixed(2)),
      pricePerHour: pricingRule.pricePerHour,
      durationHours,
      pricingRuleType: pricingRule.ruleType,
      source: pricingRule.source,
    });
  } catch (error) {
    console.error('GET /api/coaches/sessions/estimate error:', error);
    return NextResponse.json({ error: 'Failed to estimate session pricing' }, { status: 500 });
  }
}
