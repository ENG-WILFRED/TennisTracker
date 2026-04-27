import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface Comment {
  id: string;
  text: string;
  rating?: number;
  author: string;
  authorId: string;
  createdAt: Date;
}

// GET comments for a player
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;

    // For now, we'll return mock comments structure
    // In a real app, you'd query from a database
    const comments: Comment[] = [];

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;
    const { text, rating } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
    }

    // For now, create a mock comment
    // In a real app, you'd save to database
    const comment = {
      id: Math.random().toString(),
      text,
      rating: rating || 5,
      author: 'Current User', // TODO: Get from auth context
      authorId: 'user-id', // TODO: Get from auth context
      createdAt: new Date(),
    };

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
