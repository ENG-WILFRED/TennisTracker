import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  context: any
) {
  try {
    const maybeParams = context?.params;
    const params = maybeParams && typeof maybeParams.then === 'function' ? await maybeParams : maybeParams;
    const orgId = params?.orgId;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;

    const where: any = { organizationId: orgId };
    if (status) where.status = status;

    const incidents = await prisma.securityIncident.findMany({
      where,
      include: {
        reportedBy: {
          select: { id: true, firstName: true, lastName: true, photo: true },
        },
      },
      orderBy: { reportedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(incidents);
  } catch (error) {
    console.error('Failed to fetch incidents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incidents' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: any
) {
  try {
    const maybeParams = context?.params;
    const params = maybeParams && typeof maybeParams.then === 'function' ? await maybeParams : maybeParams;
    const orgId = params?.orgId;
    const { summary, location, severity, reportedById } = await req.json();

    if (!summary || !location || !severity) {
      return NextResponse.json(
        { error: 'Missing required fields: summary, location, severity' },
        { status: 400 }
      );
    }

    const incident = await prisma.securityIncident.create({
      data: {
        summary,
        location,
        severity,
        organizationId: orgId,
        reportedById: reportedById || null,
        status: 'open',
      },
      include: {
        reportedBy: {
          select: { id: true, firstName: true, lastName: true, photo: true },
        },
      },
    });

    return NextResponse.json(incident, { status: 201 });
  } catch (error) {
    console.error('Failed to create incident:', error);
    return NextResponse.json(
      { error: 'Failed to create incident' },
      { status: 500 }
    );
  }
}
