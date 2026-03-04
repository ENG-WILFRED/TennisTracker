import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'please-set-a-secure-secret';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const referee = await prisma.referee.findUnique({
      where: { userId: id },
      include: {
        user: true,
      },
    });

    if (!referee || !referee.user) {
      return NextResponse.json({ error: 'Referee not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        id: referee.user.id,
        firstName: referee.user.firstName,
        lastName: referee.user.lastName,
        photo: referee.user.photo,
        nationality: referee.user.nationality,
        matchesRefereed: referee.matchesRefereed,
        ballCrewMatches: referee.ballCrewMatches,
        experience: referee.experience,
        certifications: referee.certifications,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=5, s-maxage=5, stale-while-revalidate=10',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching referee by id:', error);
    return NextResponse.json({ error: 'Failed to fetch referee' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const auth = req.headers.get('authorization') || '';
    if (!auth.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = auth.replace('Bearer ', '');

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only referees can edit their own profile
    if (!payload || payload.role !== 'referee' || payload.id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const bodyAny = body as any;
    const data: any = {};
    if (bodyAny.bio !== undefined) data.bio = bodyAny.bio;
    if (bodyAny.photo !== undefined) data.photo = bodyAny.photo;
    if (bodyAny.nationality !== undefined) data.nationality = bodyAny.nationality;
    if (bodyAny.experience !== undefined) data.experience = bodyAny.experience;

    const updated = await prisma.referee.update({
      where: { userId: id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating referee:', error);
    return NextResponse.json({ error: 'Failed to update referee' }, { status: 500 });
  }
}
