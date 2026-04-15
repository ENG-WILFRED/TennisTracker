/**
 * Broadcast to match observers
 */
import { NextRequest, NextResponse } from 'next/server';
import { broadcastToMatch } from '@/lib/socket';

export async function POST(request: NextRequest) {
  try {
    const { matchId, type, data, excludeUserIds = [] } = await request.json();

    if (!matchId || !type) {
      return NextResponse.json({ error: 'matchId and type required' }, { status: 400 });
    }

    broadcastToMatch(matchId, type, data, excludeUserIds);

    return NextResponse.json({
      success: true,
      matchId,
      type,
      message: `Broadcast sent to match ${matchId} observers`
    });

  } catch (error) {
    console.error('Match broadcast error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}