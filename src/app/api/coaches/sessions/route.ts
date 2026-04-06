import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const coachId = url.searchParams.get('coachId');
    const organizationId = url.searchParams.get('organizationId');
    const status = url.searchParams.get('status');

    if (!coachId && !organizationId) {
      return NextResponse.json({ error: 'coachId or organizationId required' }, { status: 400 });
    }

    const sessions = await prisma.coachSession.findMany({
      where: {
        ...(coachId ? { coachId } : {}),
        ...(organizationId ? { organizationId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        coach: { select: { userId: true, user: { select: { firstName: true, lastName: true, photo: true } } } },
        player: { select: { userId: true, user: { select: { firstName: true, lastName: true } } } },
        court: { select: { id: true, name: true } },
        bookings: {
          select: {
            id: true,
            playerId: true,
            status: true,
            player: { select: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { coachId, sessionType, title, description, startTime, endTime, timezone, courtId, maxParticipants, price, organizationId } = body;

    if (!coachId || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const session = await prisma.coachSession.create({
      data: {
        coachId,
        sessionType,
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        timezone,
        courtId,
        maxParticipants,
        price,
        organizationId,
      },
      include: {
        coach: { select: { userId: true, user: { select: { firstName: true, lastName: true } } } },
        bookings: true,
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
