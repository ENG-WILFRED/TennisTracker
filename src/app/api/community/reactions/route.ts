import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { postId, userId, type = 'like' } = await request.json();

    if (!postId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already reacted
    const existingReaction = await prisma.postReaction.findFirst({
      where: {
        postId,
        userId,
        type,
      },
    });

    if (existingReaction) {
      return NextResponse.json(
        { error: 'Already reacted' },
        { status: 409 }
      );
    }

    // Create reaction
    const reaction = await prisma.postReaction.create({
      data: {
        type,
        postId,
        userId,
      },
    });

    console.log('❤️ New reaction created:', reaction.id);

    // Broadcast to WebSocket
    try {
      const broadcastRes = await fetch('http://localhost:3001/broadcast/broadcast-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reaction-added',
          data: {
            postId,
            userId,
            reactionId: reaction.id,
            reactionType: type,
          },
        }),
      });
      if (broadcastRes.ok) {
        console.log('📡 Reaction broadcast to WebSocket');
      }
    } catch (err) {
      console.warn('⚠️ WebSocket broadcast failed:', err);
    }

    return NextResponse.json(reaction, { status: 201 });
  } catch (error) {
    console.error('❤️ Error creating reaction:', error);
    return NextResponse.json(
      { error: 'Failed to create reaction' },
      { status: 500 }
    );
  }
}
