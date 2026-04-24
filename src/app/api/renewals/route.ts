import { NextRequest, NextResponse } from 'next/server';
import { renewalNotificationService } from '@/services/renewalNotificationService';

// GET /api/renewals - Get expiring memberships for an organization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const daysAhead = parseInt(searchParams.get('daysAhead') || '30', 10);

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    const expiringMemberships = await renewalNotificationService.getExpiringMemberships(
      organizationId,
      daysAhead
    );

    return NextResponse.json({
      success: true,
      expiringMemberships,
      total: expiringMemberships.length,
      daysAhead
    });

  } catch (error) {
    console.error('Renewals API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expiring memberships' },
      { status: 500 }
    );
  }
}

// POST /api/renewals/send - Send renewal notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, dryRun = false } = body;

    const notifications = await renewalNotificationService.sendExpiryNotifications();

    // Filter by organization if specified
    const filteredNotifications = organizationId
      ? notifications.filter(n => n.organizationName.includes(organizationId))
      : notifications;

    if (!dryRun) {
      // Actually send notifications
      console.log(`Sending ${filteredNotifications.length} renewal notifications`);
    }

    return NextResponse.json({
      success: true,
      notificationsSent: dryRun ? 0 : filteredNotifications.length,
      totalExpiring: filteredNotifications.length,
      dryRun,
      notifications: filteredNotifications
    });

  } catch (error) {
    console.error('Send renewals API error:', error);
    return NextResponse.json(
      { error: 'Failed to send renewal notifications' },
      { status: 500 }
    );
  }
}