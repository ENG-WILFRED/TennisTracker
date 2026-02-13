import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'please-set-a-secure-secret';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const referee = await prisma.referee.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        photo: true,
        nationality: true,
        bio: true,
        matchesRefereed: true,
        ballCrewMatches: true,
        experience: true,
        certifications: true,
      },
    });

    if (!referee) {
      return NextResponse.json({ error: 'Referee not found' }, { status: 404 });
    }

    return NextResponse.json(referee);
  } catch (error) {
    console.error('Error fetching referee by id:', error);
    return NextResponse.json({ error: 'Failed to fetch referee' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
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
    const data: any = {};
    if (body.bio !== undefined) data.bio = body.bio;
    if (body.photo !== undefined) data.photo = body.photo;
    if (body.nationality !== undefined) data.nationality = body.nationality;
    if (body.experience !== undefined) data.experience = body.experience;

    const updated = await prisma.referee.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating referee:', error);
    return NextResponse.json({ error: 'Failed to update referee' }, { status: 500 });
  }
}
