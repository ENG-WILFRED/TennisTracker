import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET player data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;

    const player = await prisma.player.findUnique({
      where: { userId: playerId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            photo: true,
            bio: true,
          },
        },
      },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json({
      player: {
        userId: player.userId,
        firstName: player.user.firstName,
        lastName: player.user.lastName,
        email: player.user.email,
        phone: player.user.phone,
        photo: player.user.photo,
        bio: player.user.bio,
        matchesPlayed: player.matchesPlayed || 0,
        matchesWon: player.matchesWon || 0,
        matchesLost: player.matchesLost || 0,
        winRate: player.matchesPlayed ? ((player.matchesWon || 0) / player.matchesPlayed * 100).toFixed(1) : 0,
        joinedAt: player.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching player:', error);
    return NextResponse.json({ error: 'Failed to fetch player' }, { status: 500 });
  }
}

// DELETE player (remove from organization)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;

    // Check if user is authorized (should be organization admin or the player themselves)
    // TODO: Add proper authorization check

    // Remove from club memberships
    await prisma.clubMember.deleteMany({
      where: { playerId },
    });

    // Player record is effectively removed from organization via clubMember deletion
    const player = await prisma.player.findUnique({
      where: { userId: playerId },
    });

    return NextResponse.json({ success: true, player });
  } catch (error) {
    console.error('Error removing player:', error);
    return NextResponse.json({ error: 'Failed to remove player' }, { status: 500 });
  }
}
