import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';


// GET /api/service-requests - Get service requests
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const providerId = searchParams.get('providerId');
    const userId = searchParams.get('userId');

    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (providerId) {
      whereClause.providerId = providerId;
    }

    if (userId) {
      whereClause.userId = userId;
    }

    const requests = await prisma.serviceBooking.findMany({
      where: whereClause,
      include: {
        service: {
          include: {
            provider: true,
          },
        },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching service requests:', error);
    return NextResponse.json({ error: 'Failed to fetch service requests' }, { status: 500 });
  }
}

// POST /api/service-requests - Create a service request
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serviceId, note } = await request.json();

    if (!serviceId) {
      return NextResponse.json({ error: 'serviceId is required' }, { status: 400 });
    }

    // Verify service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, providerId: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Create booking request using ServiceBooking model fields
    const booking = await prisma.serviceBooking.create({
      data: {
        userId: auth.playerId,
        serviceId,
        providerId: service.providerId,
        contextType: 'service-request',
        contextId: serviceId,
        note: note || null,
        status: 'requested',
      },
      include: {
        service: {
          include: {
            provider: true,
          },
        },
      },
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error('Error creating service request:', error);
    return NextResponse.json({ error: 'Failed to create service request' }, { status: 500 });
  }
}
