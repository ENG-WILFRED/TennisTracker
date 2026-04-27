import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET sessions for a player
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;

    const sessions = await prisma.coachSession.findMany({
      where: {
        bookings: {
          some: {
            playerId,
          },
        },
      },
      include: {
        court: {
          select: { name: true },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        type: s.sessionType || 'training',
        startTime: s.startTime.toISOString(),
        endTime: s.endTime.toISOString(),
        court: s.court?.name,
        maxParticipants: s.maxParticipants,
        price: s.price,
      })),
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// POST create a new session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;
    const { title, type, startTime, endTime, court } = await request.json();

    if (!title || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find a court if court name is provided
    let courtId: string | null = null;
    if (court) {
      const courtObj = await prisma.court.findFirst({
        where: { name: court },
        select: { id: true },
      });
      courtId = courtObj?.id || null;
    }

    // Get the player to find their coach
    const player = await prisma.player.findUnique({
      where: { userId: playerId },
      select: { userId: true },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Create session (as a coach would)
    // For now, we'll create a generic session
    const session = await prisma.coachSession.create({
      data: {
        title,
        description: '',
        sessionType: type || 'training',
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        courtId,
        maxParticipants: 2,
        coachId: 'coach-id', // TODO: Get actual coach ID
        organizationId: 'org-id', // TODO: Get actual org ID
      },
    });

    // Add the player to the session
    await prisma.sessionBooking.create({
      data: {
        sessionId: session.id,
        playerId,
        status: 'confirmed',
      },
    });

    return NextResponse.json({
      session: {
        id: session.id,
        title: session.title,
        type: session.sessionType,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime.toISOString(),
        court: court,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
