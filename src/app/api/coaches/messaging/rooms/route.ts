import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const coachId = url.searchParams.get('coachId');
    const playerId = url.searchParams.get('playerId');

    if (!coachId) {
      return NextResponse.json({ error: 'coachId required' }, { status: 400 });
    }

    // Find or create a direct message room between coach and player
    let query: any = {};
    if (playerId) {
      query = { AND: [{ isDM: true }] };
    } else {
      query = { isDM: true };
    }

    const chatRooms = await prisma.chatRoom.findMany({
      where: {
        isDM: true,
        participants: {
          some: {
            playerId: coachId,
          },
        },
      },
      include: {
        participants: { select: { playerId: true } },
        messages: { 
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, createdAt: true, playerId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(chatRooms);
  } catch (error) {
    console.error('Error fetching coach chat rooms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { coachUserId, playerUserId } = body;

    if (!coachUserId || !playerUserId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if DM room already exists
    const existingRoom = await prisma.chatRoom.findFirst({
      where: {
        isDM: true,
        AND: [
          { participants: { some: { playerId: coachUserId } } },
          { participants: { some: { playerId: playerUserId } } },
        ],
      },
    });

    if (existingRoom) {
      return NextResponse.json(existingRoom);
    }

    // Create new DM room
    const room = await prisma.chatRoom.create({
      data: {
        name: `Coach-Player DM`,
        isDM: true,
        createdBy: coachUserId,
        participants: {
          create: [
            { playerId: coachUserId },
            { playerId: playerUserId },
          ],
        },
      },
      include: { participants: true, messages: { take: 1 } },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('Error creating chat room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
