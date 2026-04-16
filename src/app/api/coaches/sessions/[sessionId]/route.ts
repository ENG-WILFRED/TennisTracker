import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    const session = await prisma.coachSession.findUnique({
      where: { id: sessionId },
      include: {
        coach: { select: { userId: true, user: { select: { firstName: true, lastName: true, photo: true } } } },
        player: { select: { userId: true, user: { select: { firstName: true, lastName: true } } } },
        court: { select: { id: true, name: true, surface: true } },
        bookings: {
          include: {
            player: { select: { userId: true, user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    const body = await req.json();
    const { title, description, startTime, endTime, status, courtId, maxParticipants, price } = body;

    const session = await prisma.coachSession.update({
      where: { id: sessionId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(status && { status }),
        ...(courtId && { courtId }),
        ...(maxParticipants && { maxParticipants }),
        ...(price && { price }),
      },
      include: { bookings: true },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    await prisma.coachSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
