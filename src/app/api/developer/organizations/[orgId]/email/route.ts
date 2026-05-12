import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';
import { notify } from '@/app/api/notification';

/**
 * POST /api/developer/organizations/[orgId]/email
 * Queue organization onboarding email via Kafka
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;
    const { installationFee, monthlySubscription } = await request.json();

    // Get organization
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const creator = org.createdBy
      ? await prisma.user.findUnique({
          where: { id: org.createdBy },
          select: { email: true },
        })
      : null;

    const recipientEmail = org.email || creator?.email;
    if (!recipientEmail) {
      return NextResponse.json({ error: 'No email address found for organization' }, { status: 400 });
    }

    // Queue email to Kafka for async processing
    const { id } = await notify({
      id: `org-onboarding-${orgId}-${Date.now()}`,
      to: recipientEmail,
      channel: 'email',
      template: 'org_onboarding',
      data: {
        organizationName: org.name,
        organizationId: org.id,
        installationFee: parseFloat(String(installationFee)),
        monthlySubscription: parseFloat(String(monthlySubscription)),
        contactEmail: creator?.email,
      },
    });

    console.log(`[OrgEmail] Queued onboarding email: ${recipientEmail} | Org: ${org.name} | Notification ID: ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Email queued successfully',
      notificationId: id,
    });
  } catch (error) {
    console.error('[OrgEmailEndpoint] Error:', error);
    return NextResponse.json(
      { error: 'Failed to queue email' },
      { status: 500 }
    );
  }
}