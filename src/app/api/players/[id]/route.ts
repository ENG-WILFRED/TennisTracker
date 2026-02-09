import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const p = await prisma.player.findUnique({
      where: { id },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(p);
  } catch (err) {
    console.error('GET /api/players/[id] error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
