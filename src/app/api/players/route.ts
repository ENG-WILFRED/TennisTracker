import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('query') || url.searchParams.get('q') || '';

    // Use startsWith matching so typing 'w' returns players whose
    // first name, last name, or username begins with that letter(s).
    // Prisma `mode: 'insensitive'` handles case normalization.
    // Only match on firstName and lastName (startsWith, case-insensitive)
    const whereClause = q
      ? {
          isClub: false,
          OR: [
            { user: { firstName: { startsWith: q, mode: 'insensitive' as const } } },
            { user: { lastName: { startsWith: q, mode: 'insensitive' as const } } },
          ],
        }
      : { isClub: false };

    const players = await prisma.player.findMany({
      where: whereClause,
      select: {
        userId: true,
        matchesWon: true,
        matchesPlayed: true,
        user: {
          select: { firstName: true, lastName: true, username: true, nationality: true, photo: true },
        },
      },
      orderBy: { matchesWon: 'desc' },
      take: q ? 20 : 8,
    });

    const data = players.map((p: typeof players[number]) => ({
      id: p.userId,
      nationality: p.user.nationality,
      name: `${p.user.firstName} ${p.user.lastName}`,
      username: p.user.username,
      wins: p.matchesWon,
      matchesPlayed: p.matchesPlayed,
      level: p.matchesWon > 20 ? 'Advanced' : p.matchesWon > 10 ? 'Intermediate' : 'Beginner',
      img: p.user.photo || 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&q=80',
    }));

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=5, s-maxage=5, stale-while-revalidate=10',
      },
    });
  } catch (err) {
    console.error('API /api/players error:', err);
    return NextResponse.json([], { status: 200 });
  }
}
