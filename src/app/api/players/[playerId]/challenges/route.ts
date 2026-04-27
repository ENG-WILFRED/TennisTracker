import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET challenges for a player
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;

    // For now, return mock challenges
    const challenges: any[] = [];

    return NextResponse.json({ challenges });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
  }
}

// POST create a challenge
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;
    const { title, opponentId, matchType, date, time } = await request.json();

    if (!title || !opponentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create challenge (would need a Challenge model in the database)
    const challenge = {
      id: Math.random().toString(),
      title,
      from: playerId,
      to: opponentId,
      type: matchType || 'singles',
      scheduledDate: date,
      scheduledTime: time,
      status: 'pending',
      createdAt: new Date(),
    };

    return NextResponse.json({ challenge }, { status: 201 });
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
  }
}
