import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

/**
 * GET /api/developer/organizations/[orgId]/payments
 * Get payment history for organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;

    // Verify organization exists
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Prevent runtime errors if the Prisma delegate is unavailable
    if (!prisma.organizationPayment || typeof prisma.organizationPayment.findMany !== 'function') {
      console.error('[OrgPaymentsGetEndpoint] Prisma OrganizationPayment delegate unavailable');
      return NextResponse.json(
        { error: 'Payments feature is not available. Please apply pending Prisma migrations.' },
        { status: 500 }
      );
    }

    // Get payment records
    const payments = await prisma.organizationPayment.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ payments });
  } catch (error: any) {
    if (error?.code === 'P2021') {
      console.error('[OrgPaymentsGetEndpoint] Prisma table missing:', error);
      return NextResponse.json(
        { error: 'Payments table not found. Please run prisma migrate to bring the database schema up to date.' },
        { status: 500 }
      );
    }

    console.error('[OrgPaymentsGetEndpoint] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/developer/organizations/[orgId]/payments
 * Record a payment for organization
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;
    const { amount, notes } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
    }

    // Verify organization exists
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Create payment record
    const payment = await prisma.organizationPayment.create({
      data: {
        organizationId: orgId,
        amount,
        notes,
        recordedBy: auth.userId,
        status: 'confirmed',
      },
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error('[OrgPaymentsPostEndpoint] Error:', error);
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    );
  }
}
