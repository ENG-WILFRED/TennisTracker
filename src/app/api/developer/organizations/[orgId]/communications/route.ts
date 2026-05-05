import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

/**
 * GET /api/developer/organizations/[orgId]/communications
 * Get communications between organization and developers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;

    // Verify organization exists
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get notifications sent to developers about this organization
    const notifications = await prisma.notification.findMany({
      where: {
        organizationId: orgId,
        eventType: {
          in: ['organization_review_reminder', 'organization_approved', 'organization_rejected']
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get emails sent by developers to this organization
    const emails = await prisma.developerEmailLog.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });

    // Combine and sort communications
    const communications = [
      ...notifications.map(n => ({
        id: n.id,
        type: 'notification' as const,
        direction: 'from_org' as const,
        title: n.title,
        body: n.body,
        createdAt: n.createdAt,
        sender: 'Organization',
        recipient: n.targetId || 'Developer',
        eventType: n.eventType,
      })),
      ...emails.map(e => ({
        id: e.id,
        type: 'email' as const,
        direction: 'to_org' as const,
        title: e.subject,
        body: e.body,
        createdAt: e.createdAt,
        sender: e.sentBy,
        recipient: e.recipientEmail,
        status: e.status,
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ communications });
  } catch (error) {
    console.error('[OrgCommunicationsEndpoint] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch communications' },
      { status: 500 }
    );
  }
}