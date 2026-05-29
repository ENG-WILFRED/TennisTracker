import { NextResponse } from 'next/server';
import { cacheResponse } from '@/lib/apiCache';
import { verifyApiAuth } from '@/lib/authMiddleware';
import { getCoachDashboard, getRefereeDashboard, getAdminDashboard, getStaffDashboard, getOrganizationDashboard } from '@/actions/dashboards';

export async function GET(req: Request) {
  try {
    const auth = await verifyApiAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const role = url.searchParams.get('role');
    const userId = url.searchParams.get('userId');
    const orgId = url.searchParams.get('orgId') || undefined;

    console.log('[Dashboard API] Received request:', { role, userId, orgId });

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Verify the userId matches the authenticated user
    if (auth.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!role || !['coach', 'referee', 'admin', 'staff', 'organization', 'org'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Allow legacy finance role names for backwards compatibility by normalizing to 'staff'.
    const normalizedRole = role === 'finance' ? 'staff' : role;
    const cacheKey = `dashboard:${normalizedRole}:${userId}:${orgId ?? 'none'}`;
    const dashboard = await cacheResponse(cacheKey, async () => {
      switch (normalizedRole) {
        case 'coach':
          return getCoachDashboard(userId);
        case 'referee':
          return getRefereeDashboard(userId);
        case 'admin':
          return getAdminDashboard(userId, orgId);
        case 'staff':
          return getStaffDashboard(userId);
        case 'organization':
        case 'org':
          return getOrganizationDashboard(userId, orgId);
        default:
          throw new Error('Invalid role');
      }
    }, 10_000);

    console.log('[Dashboard API] Successfully fetched dashboard data');
    return NextResponse.json(dashboard, {
      headers: {
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=45',
      },
    });
  } catch (err) {
    console.error('[Dashboard API] Error:', err instanceof Error ? err.message : err);
    console.error('[Dashboard API] Full error:', err);

    // Handle user not found errors gracefully
    if (err instanceof Error && err.message === 'User not found') {
      return NextResponse.json({
        error: 'User not found',
        message: 'Your session has expired. Please log in again.',
        action: 'logout'
      }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error', details: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
