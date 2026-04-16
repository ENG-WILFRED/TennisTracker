import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.max(1, Math.min(50, Number(url.searchParams.get('limit')) || 10));
    const sort = url.searchParams.get('sort') === 'oldest' ? 'asc' : 'desc';
    const take = page * limit;

    const [regularMatches, tournamentMatches] = await Promise.all([
      prisma.match.findMany({
        include: {
          playerA: { include: { user: true } },
          playerB: { include: { user: true } },
          referee: { include: { user: true } },
          winner: { include: { user: true } },
        },
        orderBy: { createdAt: sort },
        take,
      }),
      prisma.tournamentMatch.findMany({
        include: {
          playerA: {
            include: {
              player: { include: { user: true } },
            },
          },
          playerB: {
            include: {
              player: { include: { user: true } },
            },
          },
          event: { select: { name: true } },
        },
        orderBy: { createdAt: sort },
        take,
      }),
    ]);

    const regularData = regularMatches.map((m: typeof regularMatches[number]) => ({
      id: m.id,
      date: m.createdAt,
      playerA: m.playerA
        ? { id: m.playerA.userId, name: `${m.playerA.user.firstName} ${m.playerA.user.lastName}` }
        : null,
      playerB: m.playerB
        ? { id: m.playerB.userId, name: `${m.playerB.user.firstName} ${m.playerB.user.lastName}` }
        : null,
      status: m.score ? 'COMPLETED' : 'PENDING',
      score: m.score || 'Not started',
      winner: m.winner ? { id: m.winner.user.id, name: `${m.winner.user.firstName} ${m.winner.user.lastName}` } : null,
    }));

    const tournamentData = tournamentMatches.map((m: typeof tournamentMatches[number]) => ({
      id: m.id,
      date: m.createdAt,
      scheduledTime: m.scheduledTime,
      playerA: m.playerA
        ? { id: m.playerA.player.userId, name: `${m.playerA.player.user.firstName} ${m.playerA.player.user.lastName}` }
        : null,
      playerB: m.playerB
        ? { id: m.playerB.player.userId, name: `${m.playerB.player.user.firstName} ${m.playerB.player.user.lastName}` }
        : null,
      status: m.status?.toUpperCase() || 'PENDING',
      score: [m.scoreSetA, m.scoreSetB, m.scoreSetC].filter(Boolean).join(', ') || 'Not started',
      winner: m.winnerId
        ? { id: m.winnerId, name: m.playerA?.player.user.firstName && m.playerB?.player.user.firstName ?
            (m.winnerId === m.playerAId ? `${m.playerA?.player.user.firstName} ${m.playerA?.player.user.lastName}` : `${m.playerB?.player.user.firstName} ${m.playerB?.player.user.lastName}`)
            : 'Winner' }
        : null,
    }));

    const allMatches = [...regularData, ...tournamentData].sort((a, b) => {
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
      return sort === 'asc' ? diff : -diff;
    });

    const start = (page - 1) * limit;
    const pagedMatches = allMatches.slice(start, start + limit);
    const hasMore = allMatches.length > start + limit;

    return NextResponse.json({ items: pagedMatches, hasMore });
  } catch (err) {
    console.error('API /api/matches error:', err);
    return NextResponse.json({ items: [], hasMore: false }, { status: 200 });
  }
}