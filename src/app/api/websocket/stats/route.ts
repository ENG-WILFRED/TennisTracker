/**
 * WebSocket Statistics Endpoint
 */
import { NextResponse } from 'next/server';
import { getSocketStats } from '@/lib/socket';

export async function GET() {
  try {
    const stats = getSocketStats();

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}