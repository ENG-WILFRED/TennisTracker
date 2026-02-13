import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

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
            { firstName: { startsWith: q, mode: 'insensitive' } },
            { lastName: { startsWith: q, mode: 'insensitive' } },
          ],
        }
      : { isClub: false };

    const players = await prisma.player.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        firstName: true,
        nationality: true,
        lastName: true,
        photo: true,
        matchesWon: true,
        matchesPlayed: true,
      },
      orderBy: { matchesWon: 'desc' },
      take: q ? 20 : 8,
    });

    const data = players.map((p) => ({
      id: p.id,
      nationality: p.nationality,
      name: `${p.firstName} ${p.lastName}`,
      username: p.username,
      wins: p.matchesWon,
      matchesPlayed: p.matchesPlayed,
      level: p.matchesWon > 20 ? 'Advanced' : p.matchesWon > 10 ? 'Intermediate' : 'Beginner',
      img: p.photo || 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&q=80',
    }));

    return NextResponse.json(data);
  } catch (err) {
    console.error('API /api/players error:', err);
    return NextResponse.json([], { status: 200 });
  }
}
