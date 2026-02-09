import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET() {
  try {
    const coaches = await prisma.staff.findMany({
      where: { role: { contains: 'Coach' } },
      orderBy: { name: 'asc' },
    });

    const data = coaches.map((c) => ({
      id: c.id,
      name: c.name,
      role: c.role,
      expertise: c.expertise || 'General Coaching',
      photo: c.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      studentCount: c.studentCount || 0,
    }));

    return NextResponse.json(data);
  } catch (err) {
    console.error('API /api/coaches error:', err);
    return NextResponse.json([], { status: 200 });
  }
}
