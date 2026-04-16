import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { challengerUserId, opponentUserId } = body;

    if (!challengerUserId || !opponentUserId) {
      return NextResponse.json({ error: 'Missing challengerUserId or opponentUserId' }, { status: 400 });
    }
    if (challengerUserId === opponentUserId) {
      return NextResponse.json({ error: 'Cannot challenge yourself' }, { status: 400 });
    }

    const [challengerPlayer, opponentPlayer] = await Promise.all([
      prisma.player.findUnique({ where: { userId: challengerUserId } }),
      prisma.player.findUnique({ where: { userId: opponentUserId } }),
    ]);

    if (!challengerPlayer || !opponentPlayer) {
      return NextResponse.json({ error: 'Both users must exist as players to send a challenge' }, { status: 404 });
    }

    const challengerMembership = await prisma.clubMember.findFirst({ where: { playerId: challengerUserId } });
    const opponentMembership = await prisma.clubMember.findFirst({ where: { playerId: opponentUserId } });

    if (!challengerMembership || !opponentMembership) {
      return NextResponse.json({
        error: 'Both players must be club members to record a challenge. Encourage them to join the same organization first.',
      }, { status: 400 });
    }

    const sharedOrganizationId = challengerMembership.organizationId === opponentMembership.organizationId
      ? challengerMembership.organizationId
      : challengerMembership.organizationId || opponentMembership.organizationId;

    const challenge = await prisma.rankingChallenge.create({
      data: {
        challengerId: challengerMembership.id,
        opponentId: opponentMembership.id,
        organizationId: sharedOrganizationId,
        challengeDate: new Date(),
        status: 'pending',
      },
    });

    return NextResponse.json({
      message: 'Challenge request created successfully.',
      challengeId: challenge.id,
      status: challenge.status,
    });
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json({ error: 'Could not create challenge' }, { status: 500 });
  }
}
