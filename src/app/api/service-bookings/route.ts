import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';


// GET /api/service-bookings - Get bookings (for providers and users)
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const asProvider = searchParams.get('asProvider') === 'true';

    const whereClause: any = {};

    if (asProvider) {
      // Get bookings for services provided by this user
      const provider = await prisma.providerProfile.findUnique({
        where: { userId: auth.playerId },
        select: { id: true }
      });

      if (!provider) {
        return NextResponse.json({ bookings: [] });
      }

      whereClause.providerId = provider.id;
    } else {
      // Get bookings made by this user
      whereClause.userId = auth.playerId;
    }

    if (status) {
      whereClause.status = status;
    }

    const bookings = await prisma.serviceBooking.findMany({
      where: whereClause,
      include: {
        service: {
          include: {
            provider: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error fetching service bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch service bookings' }, { status: 500 });
  }
}

// POST /api/service-bookings - Create a new booking request
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serviceId, note } = await request.json();

    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, providerId: true, isActive: true }
    });

    if (!service?.isActive) {
      return NextResponse.json({ error: 'Service not found or inactive' }, { status: 404 });
    }

    const booking = await prisma.serviceBooking.create({
      data: {
        userId: auth.playerId,
        serviceId,
        providerId: service.providerId,
        contextType: 'general',
        contextId: serviceId, // Use service ID as context
        note: note?.trim() || null,
        status: 'requested'
      },
      include: {
        service: {
          select: {
            name: true,
            provider: {
              select: {
                businessName: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error('Error creating service booking:', error);
    return NextResponse.json({ error: 'Failed to create service booking' }, { status: 500 });
  }
}