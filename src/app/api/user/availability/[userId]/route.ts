import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    // Get the authenticated user's details including role
    const authenticatedUser = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { 
        id: true,
        staff: {
          select: { role: true }
        }
      },
    });

    if (!authenticatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is admin (has staff record with admin role)
    const isAdmin = authenticatedUser.staff?.role === 'admin';

    // Verify the user is accessing their own data or is an admin
    if (authenticatedUser.id !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if user is a staff member
    const staff = await prisma.staff.findUnique({
      where: { userId },
      select: { userId: true, role: true },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    const availability = await prisma.availability.findMany({
      where: { staffId: userId },
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        createdAt: true,
      },
      orderBy: { dayOfWeek: 'asc' },
    });

    return NextResponse.json(availability);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    // Get the authenticated user's details including role from staff record
    const authenticatedUser = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { 
        id: true,
        staff: {
          select: { role: true }
        }
      },
    });

    if (!authenticatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is admin (has staff record with admin role)
    const isAdmin = authenticatedUser.staff?.role === 'admin';

    // Verify the user is accessing their own data or is an admin
    if (authenticatedUser.id !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { day, startTime, endTime } = body;

    if (!day || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user is a staff member
    const staff = await prisma.staff.findUnique({
      where: { userId },
      select: { userId: true, role: true },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Convert day name to dayOfWeek number (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeekMap: { [key: string]: number } = {
      'Sunday': 0,
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
    };

    const dayOfWeek = dayOfWeekMap[day];
    if (dayOfWeek === undefined) {
      return NextResponse.json({ error: 'Invalid day' }, { status: 400 });
    }

    const availability = await prisma.availability.create({
      data: {
        staffId: userId,
        dayOfWeek,
        startTime,
        endTime,
      },
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        createdAt: true,
      },
    });

    return NextResponse.json(availability, { status: 201 });
  } catch (error: any) {
    console.error('Error creating availability:', error);

    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Availability already exists for this day and time' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}