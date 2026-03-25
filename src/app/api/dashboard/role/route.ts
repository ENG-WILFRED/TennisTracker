import { NextResponse } from 'next/server';
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

    let dashboard;

    switch (role) {
      case 'coach':
        dashboard = await getCoachDashboard(userId);
        break;
      case 'referee':
        dashboard = await getRefereeDashboard(userId);
        break;
      case 'admin':
        dashboard = await getAdminDashboard(userId, orgId);
        break;
      case 'finance':
        dashboard = await getFinanceDashboard(userId);
        break;
      case 'organization':
      case 'org':
        dashboard = await getOrganizationDashboard(userId, orgId);
        break;
      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    return NextResponse.json(dashboard, {
      headers: {
        'Cache-Control': 'public, max-age=10, s-maxage=10, stale-while-revalidate=20',
      },
    });
  } catch (err) {
    console.error('Dashboard API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
