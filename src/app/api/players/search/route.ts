import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const organizationId = searchParams.get('organizationId');

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Search for players by email, username, or name
    const players = await prisma.player.findMany({
      where: {
        AND: [
          {
            OR: [
              { user: { email: { contains: query, mode: 'insensitive' } } },
              { user: { username: { contains: query, mode: 'insensitive' } } },
              { user: { firstName: { contains: query, mode: 'insensitive' } } },
              { user: { lastName: { contains: query, mode: 'insensitive' } } },
            ],
          },
          // If organizationId is provided, filter by organization membership
          ...(organizationId
            ? [
              {
                clubMembers: {
                  some: { organizationId },
                },
              },
            ]
            : []),
        ],
      },
      select: {
        userId: true,
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            photo: true,
          },
        },
        ratingPoints: true,
        winRate: true,
        matchesWon: true,
        matchesLost: true,
        clubMembers: {
          where: organizationId ? { organizationId } : undefined,
          select: {
            organizationId: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      take: 10,
    });

    return NextResponse.json({
      results: players.map((p) => ({
        userId: p.userId,
        email: p.user.email,
        username: p.user.username,
        name: [p.user.firstName, p.user.lastName].filter(Boolean).join(' ').trim() || p.user.username || p.user.email,
        image: p.user.photo,
        ratingPoints: p.ratingPoints,
        winRate: p.winRate,
        matchesWon: p.matchesWon,
        matchesLost: p.matchesLost,
        organizations: p.clubMembers.map((m: any) => ({
          id: m.organizationId,
          name: m.organization.name,
        })),
      })),
    });
  } catch (error) {
    console.error('Error searching players:', error);
    return NextResponse.json(
      { error: 'Failed to search players' },
      { status: 500 }
    );
  }
}
