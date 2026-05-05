import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

const defaultOrgPricing = {
  pricePerHour: 60,
  currency: 'USD',
  minSessionDurationMinutes: 30,
  roundingType: 'up',
};

function normalizeCoachRates(coachRates: any[]) {
  return coachRates
    .filter((rate) => rate?.coachId)
    .map((rate) => ({
      id: rate.id || undefined,
      coachId: rate.coachId,
      pricePerHour: Number(rate.pricePerHour ?? 0),
      tierName: rate.tierName || null,
      description: rate.description || null,
      reason: rate.reason || null,
      isActive: rate.isActive !== false,
    }));
}

function normalizeTierPrices(tierPrices: any[]) {
  return tierPrices
    .filter((price) => price?.tierName)
    .map((price) => ({
      id: price.id || undefined,
      tierName: price.tierName,
      pricePerHour: Number(price.pricePerHour ?? 0),
      description: price.description || null,
      discountPercent: price.discountPercent != null ? Number(price.discountPercent) : null,
      isActive: price.isActive !== false,
    }));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const auth = await verifyApiAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orgId } = await params;
  if (!orgId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
  }

  try {
    const pricing = await prisma.orgCoachingPricing.findUnique({
      where: { organizationId: orgId },
      include: { coachPrices: true, tierPrices: true },
    });

    if (!pricing) {
      return NextResponse.json({
        orgPricing: defaultOrgPricing,
        coachPrices: [],
        tierPrices: [],
      });
    }

    return NextResponse.json({
      orgPricing: {
        pricePerHour: pricing.pricePerHour,
        currency: pricing.currency,
        minSessionDurationMinutes: pricing.minSessionDurationMinutes,
        roundingType: pricing.roundingType,
      },
      coachPrices: pricing.coachPrices.map((rule) => ({
        id: rule.id,
        coachId: rule.coachId,
        pricePerHour: rule.pricePerHour,
        tierName: rule.tierName,
        description: rule.description,
        reason: rule.reason,
        isActive: rule.isActive,
      })),
      tierPrices: pricing.tierPrices.map((rule) => ({
        id: rule.id,
        tierName: rule.tierName,
        pricePerHour: rule.pricePerHour,
        description: rule.description,
        discountPercent: rule.discountPercent,
        isActive: rule.isActive,
      })),
    });
  } catch (error) {
    console.error('GET /api/organization/[orgId]/settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch organization settings' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const auth = await verifyApiAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orgId } = await params;
  if (!orgId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const orgPricing = body.orgPricing || body.pricing || {};
    const coachRates = Array.isArray(body.coachRates) ? body.coachRates : Array.isArray(body.coachPrices) ? body.coachPrices : [];
    const tierPrices = Array.isArray(body.tierPrices) ? body.tierPrices : [];

    const pricingData = {
      pricePerHour: Number(orgPricing.pricePerHour ?? defaultOrgPricing.pricePerHour),
      currency: orgPricing.currency || defaultOrgPricing.currency,
      minSessionDurationMinutes: Number(orgPricing.minSessionDurationMinutes ?? defaultOrgPricing.minSessionDurationMinutes),
      roundingType: orgPricing.roundingType || defaultOrgPricing.roundingType,
    };

    const pricing = await prisma.orgCoachingPricing.upsert({
      where: { organizationId: orgId },
      update: pricingData,
      create: {
        organizationId: orgId,
        ...pricingData,
      },
      include: { coachPrices: true, tierPrices: true },
    });

    if (coachRates.length > 0) {
      await prisma.coachSpecificPrice.deleteMany({ where: { pricingId: pricing.id } });
      await prisma.coachSpecificPrice.createMany({
        data: normalizeCoachRates(coachRates).map((rate) => ({
          id: rate.id,
          pricingId: pricing.id,
          coachId: rate.coachId,
          pricePerHour: rate.pricePerHour,
          tierName: rate.tierName,
          description: rate.description,
          reason: rate.reason,
          isActive: rate.isActive,
        })),
        skipDuplicates: true,
      });
    }

    if (tierPrices.length > 0) {
      await prisma.tierCoachingPrice.deleteMany({ where: { pricingId: pricing.id } });
      await prisma.tierCoachingPrice.createMany({
        data: normalizeTierPrices(tierPrices).map((price) => ({
          id: price.id,
          pricingId: pricing.id,
          tierName: price.tierName,
          pricePerHour: price.pricePerHour,
          description: price.description,
          discountPercent: price.discountPercent,
          isActive: price.isActive,
        })),
        skipDuplicates: true,
      });
    }

    const updatedPricing = await prisma.orgCoachingPricing.findUnique({
      where: { organizationId: orgId },
      include: { coachPrices: true, tierPrices: true },
    });

    return NextResponse.json({
      success: true,
      orgPricing: {
        pricePerHour: updatedPricing?.pricePerHour ?? pricingData.pricePerHour,
        currency: updatedPricing?.currency ?? pricingData.currency,
        minSessionDurationMinutes: updatedPricing?.minSessionDurationMinutes ?? pricingData.minSessionDurationMinutes,
        roundingType: updatedPricing?.roundingType ?? pricingData.roundingType,
      },
      coachPrices: updatedPricing?.coachPrices.map((rule) => ({
        id: rule.id,
        coachId: rule.coachId,
        pricePerHour: rule.pricePerHour,
        tierName: rule.tierName,
        description: rule.description,
        reason: rule.reason,
        isActive: rule.isActive,
      })) ?? [],
      tierPrices: updatedPricing?.tierPrices.map((rule) => ({
        id: rule.id,
        tierName: rule.tierName,
        pricePerHour: rule.pricePerHour,
        description: rule.description,
        discountPercent: rule.discountPercent,
        isActive: rule.isActive,
      })) ?? [],
    });
  } catch (error) {
    console.error('PUT /api/organization/[orgId]/settings error:', error);
    return NextResponse.json({ error: 'Failed to update organization settings' }, { status: 500 });
  }
}
