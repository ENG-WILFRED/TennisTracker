import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; availId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, availId } = await params;

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

    // Check if the availability exists and belongs to the user
    const availability = await prisma.availability.findFirst({
      where: {
        id: availId,
        staffId: userId,
      },
    });

    if (!availability) {
      return NextResponse.json({ error: 'Availability not found' }, { status: 404 });
    }

    // Delete the availability
    await prisma.availability.delete({
      where: { id: availId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}