import { NextResponse } from 'next/server';
import { getPlayerDashboard } from '@/actions/matches';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const playerId = url.searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json({ error: 'playerId is required' }, { status: 400 });
    }

    const dashboard = await getPlayerDashboard(playerId);
    return NextResponse.json(dashboard);
  } catch (err) {
    console.error('Dashboard API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}