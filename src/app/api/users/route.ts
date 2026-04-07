import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const excludeId = searchParams.get('exclude');

    const users = await prisma.user.findMany({
      where: excludeId ? { id: { not: excludeId } } : undefined,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        photo: true,
        player: { select: { userId: true } },
        referee: { select: { userId: true } },
        staff: { select: { userId: true } },
        spectator: { select: { userId: true } },
      },
      orderBy: { firstName: 'asc' },
    });

    // Map to include role
    const usersWithRole = users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      photo: user.photo,
      role: user.player ? 'player' : user.referee ? 'referee' : user.staff ? 'staff' : user.spectator ? 'spectator' : 'user',
    }));

    return NextResponse.json(usersWithRole);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
