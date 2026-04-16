import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ playerId: string }> }) {
  try {
    const { playerId } = await params;
    const url = new URL(req.url);
    const coachId = url.searchParams.get('coachId');

    if (!coachId) {
      return NextResponse.json({ error: 'coachId required' }, { status: 400 });
    }

    const relationship = await prisma.coachPlayerRelationship.findUnique({
      where: {
        coachId_playerId: { coachId, playerId },
      },
    });

    if (!relationship) {
      return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
    }

    const notes = await prisma.coachPlayerNote.findMany({
      where: { relationshipId: relationship.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ playerId: string }> }) {
  try {
    const body = await req.json();
    const { coachId, title, content, category } = body;
    const { playerId } = await params;

    if (!coachId || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const relationship = await prisma.coachPlayerRelationship.findUnique({
      where: {
        coachId_playerId: { coachId, playerId },
      },
    });

    if (!relationship) {
      return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
    }

    const note = await prisma.coachPlayerNote.create({
      data: {
        relationshipId: relationship.id,
        title,
        content,
        category,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
