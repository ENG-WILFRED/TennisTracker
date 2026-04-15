/**
 * Broadcast to chat participants
 */
import { NextRequest, NextResponse } from 'next/server';
import { broadcastToChat } from '@/lib/socket';

export async function POST(request: NextRequest) {
  try {
    const { chatId, type, data, excludeUserIds = [] } = await request.json();

    if (!chatId || !type) {
      return NextResponse.json({ error: 'chatId and type required' }, { status: 400 });
    }

    await broadcastToChat(chatId, type, data, excludeUserIds);

    return NextResponse.json({
      success: true,
      chatId,
      type,
      message: `Broadcast sent to chat ${chatId} participants`
    });

  } catch (error) {
    console.error('Chat broadcast error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}