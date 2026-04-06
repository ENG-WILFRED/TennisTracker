import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const coachId = url.searchParams.get('coachId');
    const status = url.searchParams.get('status');

    if (!coachId) {
      return NextResponse.json({ error: 'coachId required' }, { status: 400 });
    }

    const relationships = await prisma.coachPlayerRelationship.findMany({
      where: {
        coachId,
        ...(status && { status }),
      },
      include: {
        player: {
          select: {
            userId: true,
            user: { select: { firstName: true, lastName: true, photo: true, email: true } },
          },
        },
        notes: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      orderBy: { joinedAt: 'desc' },
    });


    return NextResponse.json(relationships);
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { coachId, playerId } = body;

    if (!coachId || !playerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const relationship = await prisma.coachPlayerRelationship.upsert({
      where: {
        coachId_playerId: { coachId, playerId },
      },
      update: { status: 'active' },
      create: {
        coachId,
        playerId,
        status: 'active',
      },
    });

    return NextResponse.json(relationship, { status: 201 });
  } catch (error) {
    console.error('Error adding player:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
