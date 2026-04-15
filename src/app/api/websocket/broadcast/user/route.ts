/**
 * Broadcast to specific user
 */
import { NextRequest, NextResponse } from 'next/server';
import { broadcastToUser } from '@/lib/socket';

export async function POST(request: NextRequest) {
  try {
    const { userId, type, data } = await request.json();

    if (!userId || !type) {
      return NextResponse.json({ error: 'userId and type required' }, { status: 400 });
    }

    broadcastToUser(userId, type, data);

    return NextResponse.json({
      success: true,
      userId,
      type,
      message: `Broadcast sent to user ${userId}`
    });

  } catch (error) {
    console.error('User broadcast error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}