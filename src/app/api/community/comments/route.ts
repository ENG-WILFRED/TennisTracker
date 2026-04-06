import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { postId, userId, content } = await request.json();

    if (!postId || !userId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create comment
    const comment = await prisma.postComment.create({
      data: {
        content: content.trim(),
        authorId: userId,
        postId,
      },
      include: {
        author: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    console.log('💬 New comment created:', comment.id);

    // Broadcast to WebSocket
    try {
      const broadcastRes = await fetch('http://localhost:3001/broadcast/broadcast-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'comment-added',
          data: {
            postId,
            comment: {
              id: comment.id,
              content: comment.content,
              authorId: comment.authorId,
              createdAt: comment.createdAt,
              author: comment.author,
            },
          },
        }),
      });
      if (broadcastRes.ok) {
        console.log('📡 Comment broadcast to WebSocket');
      }
    } catch (err) {
      console.warn('⚠️ WebSocket broadcast failed:', err);
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('💬 Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
