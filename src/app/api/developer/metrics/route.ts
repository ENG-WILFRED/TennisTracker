import { NextRequest, NextResponse } from 'next/server'
import { collectDeveloperMetrics, getCachedDeveloperMetrics } from '@/lib/developerMetrics';

export async function GET(request: NextRequest) {
  try {
    const cached = getCachedDeveloperMetrics();
    if (cached) {
      return NextResponse.json(cached);
    }

    const metrics = await collectDeveloperMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching developer metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}