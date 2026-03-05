import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const m = await prisma.match.findUnique({
      where: { id },
      include: {
        playerA: { include: { user: true } },
        playerB: { include: { user: true } },
        referee: { include: { user: true } },
        winner: { include: { user: true } },
      },
    });
    if (!m) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

    const data = {
      id: m.id,
      round: m.round,
      createdAt: m.createdAt,
      status: m.score ? 'COMPLETED' : 'PENDING',
      playerA: m.playerA != null
          ? { id: m.playerA.userId, name: `${m.playerA.user.firstName} ${m.playerA.user.lastName}` }
          : null,
      playerB: m.playerB != null
          ? { id: m.playerB.userId, name: `${m.playerB.user.firstName} ${m.playerB.user.lastName}` }
          : null,
      score: m.score,
      winner: m.winner ? { id: m.winner.user.id, name: `${m.winner.user.firstName} ${m.winner.user.lastName}` } : null,
    };
    return NextResponse.json(data);
  } catch (err) {
    console.error('API /api/matches/[id] error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}