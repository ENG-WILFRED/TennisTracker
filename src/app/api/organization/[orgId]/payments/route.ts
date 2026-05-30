import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';
import { notify } from '@/app/api/notification/producer';

async function computeSessionPayments(orgId: string) {
  // Find completed sessions without a sessionPayment
  const sessions = await prisma.coachSession.findMany({
    where: {
      organizationId: orgId,
      status: 'completed',
      sessionPayment: null,
    },
  });

  if (sessions.length === 0) return { created: 0, totalAmount: '0' };

  // Get org pricing
  const orgPricing = await prisma.orgCoachingPricing.findUnique({ where: { organizationId: orgId } });

  let created = 0;
  let totalAmount = 0;

  for (const s of sessions) {
    try {
      const durationMinutes = s.durationMinutes ?? Math.max(Math.round((s.endTime.getTime() - s.startTime.getTime()) / 60000), 0);
      const durationHours = Number((durationMinutes / 60).toFixed(2));

      // pricePerHour resolution: session.price (treat as total session price) else org pricing or fallback 0
      let pricePerHour = 0;
      let pricingRuleType = 'org_default';

      if (s.price && s.price > 0) {
        // If session.price present, treat as session total and derive pricePerHour
        pricePerHour = Number((s.price / (durationHours || 1)).toFixed(2));
        pricingRuleType = 'session_price';
      } else if (orgPricing) {
        // check for coach-specific price override
        const coachPrice = await prisma.coachSpecificPrice.findFirst({ where: { pricingId: orgPricing.id, coachId: s.coachId, isActive: true } });
        if (coachPrice) {
          pricePerHour = coachPrice.pricePerHour;
          pricingRuleType = 'coach_specific';
        } else {
          pricePerHour = orgPricing.pricePerHour;
          pricingRuleType = 'org_default';
        }
      }

      const amount = Number((pricePerHour * durationHours).toFixed(2));

      // Coach commission
      const coachPricing = await prisma.coachPricing.findUnique({ where: { staffId: s.coachId } });
      const commissionRate = coachPricing?.commissionRate ? Number(coachPricing.commissionRate) : 0.6;
      const coachEarnings = Number((amount * commissionRate).toFixed(2));

      // Create SessionPayment
      await prisma.sessionPayment.create({
        data: {
          sessionId: s.id,
          organizationId: orgId,
          playerId: s.playerId || '',
          coachId: s.coachId,
          playerTier: null,
          amount: amount.toString(),
          durationMinutes: durationMinutes,
          durationHours: String(durationHours),
          pricePerHour: pricePerHour.toString(),
          pricingRuleType,
          tierPriceId: null,
          coachPriceId: null,
          coachEarnings: coachEarnings.toString(),
          coachCommissionRate: commissionRate.toString(),
          status: 'pending',
        },
      });

      // Create CoachEarning
      await prisma.coachEarning.create({
        data: {
          sessionId: s.id,
          coachId: s.coachId,
          organizationId: orgId,
          sessionPrice: amount.toString(),
          coachPercentage: commissionRate.toString(),
          amount: coachEarnings.toString(),
          status: 'pending',
        },
      });

      created++;
      totalAmount += amount;
    } catch (err) {
      console.error('Error computing payment for session', s.id, err);
    }
  }

  return { created, totalAmount: totalAmount.toFixed(2) };
}

export async function GET(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending';

    // Return pending coach earnings grouped by coach
    const earnings = await prisma.coachEarning.findMany({
      where: { organizationId: orgId, status },
      include: { staff: { include: { user: true } }, session: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, earnings });
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { orgId } = await params;
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'compute';

    // Ensure requester is staff of the organization
    const staff = await prisma.staff.findFirst({ where: { userId: auth.userId, organizationId: orgId } });
    if (!staff) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

    if (action === 'compute') {
      const result = await computeSessionPayments(orgId);
      return NextResponse.json({ success: true, result });
    }

    if (action === 'remind') {
      // Sum pending coach earnings for the organization
      const pending = await prisma.coachEarning.findMany({ where: { organizationId: orgId, status: 'pending' } });
      const total = pending.reduce((sum, e) => sum + Number(e.amount), 0).toFixed(2);

      // Notify org admins
      const admins = await prisma.membership.findMany({ where: { orgId, role: 'admin', status: 'accepted' }, include: { user: true } });
      const org = await prisma.organization.findUnique({ where: { id: orgId } });

      const subject = `Pending coach payouts: ${total}`;
      const message = `There are pending coach payouts totaling ${total}. Please review and process payments.`;

      for (const a of admins) {
        try {
          await notify({ to: a.user.email, channel: 'email', template: 'org_pending_payouts', data: { subject, message, organizationName: org?.name } });
        } catch (err) {
          console.error('Failed to notify admin', a.user.email, err);
        }
      }

      return NextResponse.json({ success: true, recipients: admins.map(a => a.user.email), total });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
  } catch (error) {
    console.error('Error in payments POST:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
