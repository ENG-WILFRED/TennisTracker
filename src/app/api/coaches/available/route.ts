import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const coaches = await prisma.staff.findMany({
      where: { role: { contains: 'Coach' }, employedById: null },
      select: {
        userId: true,
        role: true,
        expertise: true,
        user: {
          select: { firstName: true, lastName: true, photo: true },
        },
      },
      orderBy: { user: { firstName: 'asc' } },
    });

    const data = coaches.map((c: typeof coaches[number]) => ({
      id: c.userId,
      name: `${c.user.firstName} ${c.user.lastName}`,
      role: c.role,
      expertise: c.expertise || 'General Coaching',
      photo: c.user.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    }));

    return NextResponse.json(data);
  } catch (err) {
    console.error('API /api/coaches/available error:', err);
    return NextResponse.json([], { status: 200 });
  }
}