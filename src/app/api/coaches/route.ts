import { NextResponse } from 'next/server';
import { cacheResponse } from '@/lib/apiCache';
import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET() {
  try {
    const coaches = await prisma.staff.findMany({
      where: { role: { contains: 'Coach' } },
      select: {
        userId: true,
        role: true,
        expertise: true,
        studentCount: true,
        user: {
          select: { firstName: true, lastName: true, photo: true },
        },
      },
      orderBy: { user: { firstName: 'asc' } },
    });

    const data = await cacheResponse('coaches:list', async () => {
      return coaches.map((c) => ({
        id: c.userId,
        name: `${c.user.firstName} ${c.user.lastName}`,
        role: c.role,
        expertise: c.expertise || 'General Coaching',
        photo: c.user.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
        studentCount: c.studentCount || 0,
      }));
    }, 15_000);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=5, s-maxage=5, stale-while-revalidate=10',
      },
    });
  } catch (err) {
    console.error('API /api/coaches error:', err);
    return NextResponse.json([], { status: 200 });
  }
}
