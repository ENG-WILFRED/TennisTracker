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
