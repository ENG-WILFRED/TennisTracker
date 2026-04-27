import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { coachId, playerId, orgId } = body;

    if (!coachId || !playerId) {
      return NextResponse.json(
        { error: 'Missing required fields: coachId and playerId' },
        { status: 400 }
      );
    }

    // Check if relationship already exists
    const existingRelationship = await prisma.coachPlayerRelationship.findUnique({
      where: {
        coachId_playerId: { coachId, playerId },
      },
    });

    if (existingRelationship) {
      return NextResponse.json(
        { error: 'Player is already recruited by this coach' },
        { status: 400 }
      );
    }

    // Get player info
    const player = await prisma.player.findUnique({
      where: { userId: playerId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Create the relationship
    const relationship = await prisma.coachPlayerRelationship.create({
      data: {
        coachId,
        playerId,
        status: 'active',
        joinedAt: new Date(),
      },
      include: {
        player: {
          select: {
            userId: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    // Log activity
    console.log(`✅ Player ${player.user.firstName} ${player.user.lastName} recruited by coach ${coachId}`);

    return NextResponse.json(
      {
        message: 'Player recruited successfully',
        relationship,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error recruiting player:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
