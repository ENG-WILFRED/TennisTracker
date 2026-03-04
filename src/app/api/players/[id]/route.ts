import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const p = await prisma.player.findUnique({
      where: { userId: id },
      include: { user: true },
    });
    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(
      {
        id: p.userId,
        email: p.user.email,
        firstName: p.user.firstName,
        lastName: p.user.lastName,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=5, s-maxage=5, stale-while-revalidate=10',
        },
      }
    );
  } catch (err) {
    console.error('GET /api/players/[id] error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
