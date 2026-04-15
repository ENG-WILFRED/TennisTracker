import { NextResponse } from 'next/server';
import { cacheResponse } from '@/lib/apiCache';
import { getCoachDashboard, getRefereeDashboard, getAdminDashboard, getFinanceDashboard, getOrganizationDashboard } from '@/actions/dashboards';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const role = url.searchParams.get('role');
    const userId = url.searchParams.get('userId');
    const orgId = url.searchParams.get('orgId') || undefined;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!role || !['coach', 'referee', 'admin', 'finance', 'organization', 'org'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const cacheKey = `dashboard:${role}:${userId}:${orgId ?? 'none'}`;
    const dashboard = await cacheResponse(cacheKey, async () => {
      switch (role) {
        case 'coach':
          return getCoachDashboard(userId);
        case 'referee':
          return getRefereeDashboard(userId);
        case 'admin':
          return getAdminDashboard(userId, orgId);
        case 'finance':
          return getFinanceDashboard(userId);
        case 'organization':
        case 'org':
          return getOrganizationDashboard(userId, orgId);
        default:
          throw new Error('Invalid role');
      }
    }, 10_000);

    return NextResponse.json(dashboard, {
      headers: {
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=45',
      },
    });
  } catch (err) {
    console.error('Dashboard API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
