import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET() {
  try {
    const [regularMatches, tournamentMatches] = await Promise.all([
      prisma.match.findMany({
        include: {
          playerA: { include: { user: true } },
          playerB: { include: { user: true } },
          referee: { include: { user: true } },
          winner: { include: { user: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
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
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    const regularData = regularMatches.map((m) => ({
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

    const tournamentData = tournamentMatches.map((m) => ({
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

    const data = [...regularData, ...tournamentData]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(data);
  } catch (err) {
    console.error('API /api/matches error:', err);
    return NextResponse.json([], { status: 200 });
  }
}