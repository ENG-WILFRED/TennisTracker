import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; courtId: string }> }
) {
  try {
    if (!verifyApiAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId, courtId } = await params;

    const court = await prisma.court.findFirst({
      where: {
        id: courtId,
        organizationId: orgId,
      },
    });

    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 });
    }

    // Fetch bookings for this court
    const bookings = await prisma.courtBooking.findMany({
      where: {
        courtId: courtId,
      },
      include: {
        member: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    // Fetch comments
    const comments = await prisma.courtComment.findMany({
      where: {
        courtId: courtId,
      },
      include: {
        author: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Fetch complaints
    const complaints = await prisma.courtComplaint.findMany({
      where: {
        courtId: courtId,
      },
      include: {
        author: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate statistics
    const allBookings = await prisma.courtBooking.findMany({
      where: {
        courtId: courtId,
      },
    });

    const confirmedBookings = allBookings.filter(b => b.status === 'confirmed').length;
    const cancelledBookings = allBookings.filter(b => b.status === 'cancelled').length;
    const totalRevenue = allBookings.reduce((sum, b) => sum + (b.price || 0), 0);
    
    const avgRating = comments.length > 0 
      ? comments.reduce((sum, c) => sum + (c.rating || 5), 0) / comments.length 
      : undefined;

    const stats = {
      totalBookings: allBookings.length,
      confirmedBookings: confirmedBookings,
      cancelledBookings: cancelledBookings,
      revenue: totalRevenue,
      averageRating: avgRating,
      complaintCount: complaints.length,
      resolvedComplaints: complaints.filter(c => c.status === 'resolved').length,
    };

    return NextResponse.json({ court, bookings, comments, complaints, stats });
  } catch (error) {
    console.error('GET court error:', error);
    return NextResponse.json({ error: 'Failed to fetch court' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; courtId: string }> }
) {
  try {
    if (!verifyApiAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId, courtId } = await params;
    const body = await request.json();
    const { name, courtNumber, surface, indoorOutdoor, lights, status } = body;

    const court = await prisma.court.updateMany({
      where: {
        id: courtId,
        organizationId: orgId,
      },
      data: {
        name,
        courtNumber: courtNumber ? parseInt(courtNumber) : undefined,
        surface,
        indoorOutdoor,
        lights,
        status,
      },
    });

    if (court.count === 0) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 });
    }

    const updated = await prisma.court.findUnique({ where: { id: courtId } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT court error:', error);
    return NextResponse.json({ error: 'Failed to update court' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; courtId: string }> }
) {
  try {
    if (!verifyApiAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId, courtId } = await params;
    const body = await request.json();

    // PATCH allows partial updates - only update fields that are provided
    const updateData: any = {};
    
    // Only include fields that were explicitly provided
    if (body.name !== undefined) updateData.name = body.name;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.country !== undefined) updateData.country = body.country;
    if (body.latitude !== undefined) updateData.latitude = body.latitude;
    if (body.longitude !== undefined) updateData.longitude = body.longitude;
    if (body.surface !== undefined) updateData.surface = body.surface;
    if (body.indoorOutdoor !== undefined) updateData.indoorOutdoor = body.indoorOutdoor;
    if (body.lights !== undefined) updateData.lights = body.lights;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.width !== undefined) updateData.width = body.width;
    if (body.length !== undefined) updateData.length = body.length;
    if (body.maxCapacity !== undefined) updateData.maxCapacity = body.maxCapacity;
    if (body.peakHourStart !== undefined) updateData.peakHourStart = body.peakHourStart;
    if (body.peakHourEnd !== undefined) updateData.peakHourEnd = body.peakHourEnd;
    if (body.peakPrice !== undefined) updateData.peakPrice = body.peakPrice;
    if (body.offPeakPrice !== undefined) updateData.offPeakPrice = body.offPeakPrice;
    if (body.openTime !== undefined) updateData.openTime = body.openTime;
    if (body.closeTime !== undefined) updateData.closeTime = body.closeTime;
    if (body.amenities !== undefined) updateData.amenities = body.amenities;
    if (body.rules !== undefined) updateData.rules = body.rules;
    if (body.availableDays !== undefined) updateData.availableDays = body.availableDays;
    if (body.nextMaintenanceDate !== undefined) updateData.nextMaintenanceDate = body.nextMaintenanceDate;
    if (body.courtNumber !== undefined) updateData.courtNumber = parseInt(body.courtNumber);

    const court = await prisma.court.updateMany({
      where: {
        id: courtId,
        organizationId: orgId,
      },
      data: updateData,
    });

    if (court.count === 0) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 });
    }

    const updated = await prisma.court.findUnique({ where: { id: courtId } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH court error:', error);
    return NextResponse.json({ error: 'Failed to update court' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; courtId: string }> }
) {
  try {
    if (!verifyApiAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId, courtId } = await params;

    const court = await prisma.court.deleteMany({
      where: {
        id: courtId,
        organizationId: orgId,
      },
    });

    if (court.count === 0) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Court deleted successfully' });
  } catch (error) {
    console.error('DELETE court error:', error);
    return NextResponse.json({ error: 'Failed to delete court' }, { status: 500 });
  }
}
