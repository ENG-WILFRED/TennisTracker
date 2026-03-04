import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      include: {
        playerA: { include: { user: true } },
        playerB: { include: { user: true } },
        referee: { include: { user: true } },
        winner: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const data = matches.map((m) => ({
      id: m.id,
      date: m.createdAt,
      playerA: m.playerA
        ? { id: m.playerA.userId, name: `${m.playerA.user.firstName} ${m.playerA.user.lastName}` }
        : null,
      playerB: m.playerB
        ? { id: m.playerB.userId, name: `${m.playerB.user.firstName} ${m.playerB.user.lastName}` }
        : null,
      status: m.score ? 'COMPLETED' : 'PENDING',
      winner: m.winner ? { id: m.winner.user.id, name: `${m.winner.user.firstName} ${m.winner.user.lastName}` } : null,
    }));

    return NextResponse.json(data);
  } catch (err) {
    console.error('API /api/matches error:', err);
    return NextResponse.json([], { status: 200 });
  }
}