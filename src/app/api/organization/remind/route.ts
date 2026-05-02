import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

/**
 * POST /api/organization/remind
 * Send a reminder to developers to review the organization registration
 */
export async function POST(request: Request) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { organizationId } = body as { organizationId: string };

    if (!organizationId) {
      return new Response(JSON.stringify({ error: 'Organization ID is required' }), { status: 400 });
    }

    // Get the organization
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        status: true,
        createdBy: true,
      },
    });

    if (!org) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), { status: 404 });
    }

    // Check if the user is the creator of the organization
    if (org.createdBy !== auth.userId) {
      return new Response(JSON.stringify({ error: 'Only the organization creator can send reminders' }), { status: 403 });
    }

    // Check if organization is still pending
    if (org.status !== 'pending') {
      return new Response(JSON.stringify({ error: `Organization is already ${org.status}` }), { status: 400 });
    }

    // Get all developer users (users with developer role or specific emails)
    const developers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { endsWith: '@tennistrack.dev' } },
          { memberships: { some: { role: 'developer' } } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    // Create notifications for each developer
    const notifications = await Promise.all(
      developers.map((dev) =>
        prisma.notification.create({
          data: {
            organizationId: org.id,
            userId: dev.id,
            type: 'organization_review_reminder',
            title: '📋 Organization Review Reminder',
            message: `${org.name} is waiting for approval. Please review and approve or decline the organization registration.`,
            read: false,
          },
        })
      )
    );

    // Also log this reminder in the organization activity
    await prisma.organizationActivity.create({
      data: {
        organizationId: org.id,
        activityType: 'reminder_sent',
        description: `Reminder sent to developers to review the organization registration`,
        userId: auth.userId,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Reminder sent to ${developers.length} developer(s) to review your organization registration`,
        notificationsCount: notifications.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending reminder:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
