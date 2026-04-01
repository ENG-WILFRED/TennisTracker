import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    if (!verifyApiAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const courts = await prisma.court.findMany({
      where: { organizationId: orgId },
      orderBy: { courtNumber: 'asc' },
    });

    return NextResponse.json({ courts });
  } catch (error) {
    console.error('GET /api/organization/[orgId]/courts error:', error);
    return NextResponse.json({ error: 'Failed to fetch courts' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    if (!verifyApiAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;
    const body = await request.json();

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const { name, courtNumber, surface, indoorOutdoor, lights, status } = body;

    if (!name || courtNumber === undefined) {
      return NextResponse.json({ error: 'Name and court number are required' }, { status: 400 });
    }

    const court = await prisma.court.create({
      data: {
        organizationId: orgId,
        name,
        courtNumber: parseInt(courtNumber),
        surface,
        indoorOutdoor,
        lights,
        status,
      },
    });

    return NextResponse.json(court);
  } catch (error) {
    console.error('POST /api/organization/[orgId]/courts error:', error);
    return NextResponse.json({ error: 'Failed to create court' }, { status: 500 });
  }
}