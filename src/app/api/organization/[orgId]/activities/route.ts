import { OrganizationActivityTracker } from '@/lib/organizationActivity';

export async function GET(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;

    const activities = await OrganizationActivityTracker.getRecentActivities(orgId, 20);

    return new Response(JSON.stringify(activities), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching organization activities:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}