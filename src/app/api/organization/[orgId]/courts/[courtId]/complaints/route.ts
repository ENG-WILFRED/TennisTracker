import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; courtId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId, courtId } = await params;
    const body = await request.json();
    const { title, description, severity = 'medium', category = 'maintenance' } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const court = await prisma.court.findFirst({
      where: {
        id: courtId,
        organizationId: orgId,
      },
    });

    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 });
    }

    // Ensure the authenticated user has a Player record before creating the complaint.
    const existingPlayer = await prisma.player.findUnique({
      where: { userId: auth.userId },
    });

    if (!existingPlayer) {
      await prisma.player.create({
        data: { userId: auth.userId },
      });
    }

    const complaint = await prisma.courtComplaint.create({
      data: {
        courtId,
        authorId: auth.userId,
        title,
        description,
        category,
        severity,
        status: 'pending',
      },
      include: {
        court: {
          select: {
            name: true,
            courtNumber: true,
          },
        },
      },
    });

    return NextResponse.json({ complaint }, { status: 201 });
  } catch (error) {
    console.error('POST court complaint error:', error);
    return NextResponse.json({ error: 'Failed to create maintenance request' }, { status: 500 });
  }
}
