import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const playerId = url.searchParams.get('playerId');
    const sessionId = url.searchParams.get('sessionId');
    const coachId = url.searchParams.get('coachId');
    const status = url.searchParams.get('status');

    const bookings = await prisma.sessionBooking.findMany({
      where: {
        ...(playerId ? { playerId } : {}),
        ...(sessionId ? { sessionId } : {}),
        ...(status ? { status } : {}),
        ...(coachId ? { session: { coachId } } : {}),
      },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            coachId: true,
            coach: { select: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
        player: { select: { userId: true, user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, playerId } = body;

    if (!sessionId || !playerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if booking already exists
    const existingBooking = await prisma.sessionBooking.findUnique({
      where: { sessionId_playerId: { sessionId, playerId } },
    });

    if (existingBooking) {
      return NextResponse.json({ error: 'Player already booked for this session' }, { status: 409 });
    }

    const booking = await prisma.sessionBooking.create({
      data: {
        sessionId,
        playerId,
        status: 'pending',
      },
      include: {
        session: true,
        player: { select: { userId: true, user: { select: { firstName: true, lastName: true } } } },
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
