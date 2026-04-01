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
      select: {
        userId: true,
        user: {
          select: { email: true, firstName: true, lastName: true },
        },
      },
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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Validate auth header (optional - add if you have auth middleware)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allowed fields to update
    const allowed_fields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'bio',
      'gender',
      'dateOfBirth',
      'nationality',
      'photo',
    ];

    const updateData: any = {};
    for (const field of allowed_fields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(
      {
        success: true,
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        bio: updatedUser.bio,
        gender: updatedUser.gender,
        dateOfBirth: updatedUser.dateOfBirth,
        nationality: updatedUser.nationality,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('PUT /api/players/[id] error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
