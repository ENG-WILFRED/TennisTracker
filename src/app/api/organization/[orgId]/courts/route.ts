import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    if (!(await verifyApiAuth(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const now = new Date();
    await prisma.court.updateMany({
      where: {
        organizationId: orgId,
        maintenedUntil: {
          gte: now,
        },
        status: {
          not: 'Maintenance',
        },
      },
      data: {
        status: 'Maintenance',
      },
    });

    await prisma.court.updateMany({
      where: {
        organizationId: orgId,
        maintenedUntil: {
          lt: now,
        },
        status: 'Maintenance',
      },
      data: {
        status: 'Active',
      },
    });

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
    if (!(await verifyApiAuth(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;
    const body = await request.json();

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const { name, courtNumber, surface, indoorOutdoor, lights, status, maintenedUntil, nextMaintenanceDate } = body;

    if (!name || courtNumber === undefined) {
      return NextResponse.json({ error: 'Name and court number are required' }, { status: 400 });
    }

    // Helper to convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO-8601 with seconds
    const formatDatetime = (value: string | undefined) => {
      if (!value) return undefined;
      if (value.includes(':') && value.length >= 16) {
        if (value.length === 16) {
          return new Date(value + ':00').toISOString();
        }
      }
      return new Date(value).toISOString();
    };

    const court = await prisma.court.create({
      data: {
        organizationId: orgId,
        name,
        courtNumber: parseInt(courtNumber),
        surface,
        indoorOutdoor,
        lights,
        status,
        maintenedUntil: maintenedUntil ? new Date(formatDatetime(maintenedUntil)!) : undefined,
        nextMaintenanceDate: nextMaintenanceDate ? new Date(formatDatetime(nextMaintenanceDate)!) : undefined,
      },
    });

    return NextResponse.json(court);
  } catch (error) {
    console.error('POST /api/organization/[orgId]/courts error:', error);
    return NextResponse.json({ error: 'Failed to create court' }, { status: 500 });
  }
}