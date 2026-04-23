import prisma from '@/lib/prisma';
import type { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Verify organization exists
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true },
    });

    if (!org) {
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { status: 404 }
      );
    }

    // Build query filter
    const where: any = { organizationId: orgId };
    if (severity) {
      where.severity = severity;
    }

    // Fetch notifications for the organization
    const notifications = await prisma.clubAnnouncement.findMany({
      where: {
        organizationId: orgId,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        message: true,
        announcementType: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' as const },
      take: Math.min(limit, 100),
    });

    // Transform to match expected format
    const transformedNotifications = notifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      severity: 'info' as const, // Default severity since ClubAnnouncement doesn't have this field
      type: notification.announcementType,
      isRead: false, // Default to false since we don't have user context
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    }));

    return new Response(
      JSON.stringify(transformedNotifications),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=180',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching organization notifications:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}
