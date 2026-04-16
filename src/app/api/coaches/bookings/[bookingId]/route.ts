import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const body = await req.json();
    const { status, attendanceStatus, feedbackRating, feedbackText } = body;
    const { bookingId } = await params;

    const booking = await prisma.sessionBooking.update({
      where: { id: bookingId },
      data: {
        ...(status && { status }),
        ...(attendanceStatus && { attendanceStatus }),
        ...(feedbackRating !== undefined && { feedbackRating }),
        ...(feedbackText && { feedbackText }),
        ...(status === 'completed' && { completedAt: new Date() }),
      },
      include: {
        session: true,
        player: { select: { userId: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });

    // Update coach stats if session is completed
    if (status === 'completed') {
      const session = await prisma.coachSession.findUnique({
        where: { id: booking.sessionId },
        select: { coachId: true },
      });

      if (session) {
        await prisma.coachStats.upsert({
          where: { coachId: session.coachId },
          update: { completedSessions: { increment: 1 } },
          create: {
            coachId: session.coachId,
            completedSessions: 1,
            totalSessions: 0,
          },
        });
      }
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const { bookingId } = await params;
    await prisma.sessionBooking.delete({
      where: { id: bookingId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
