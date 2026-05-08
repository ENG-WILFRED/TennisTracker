import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

/**
 * POST /api/developer/organizations/[orgId]
 * Approve or reject an organization registration
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Verify user is a developer
    const isDeveloper = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { email: true },
    }).then(user => user?.email?.endsWith('@tennistrack.dev') || false);

    if (!isDeveloper) {
      return new Response(JSON.stringify({ error: 'Only developers can approve organizations' }), { status: 403 });
    }

    const { orgId } = await params;
    const body = await request.json();
    const { action, rejectionReason } = body as { action: 'approve' | 'reject' | 'suspend' | 'reactivate' | 'email' | 'delete'; rejectionReason?: string };

    if (!action || !['approve', 'reject', 'suspend', 'reactivate', 'email', 'delete'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Action must be approve, reject, suspend, reactivate, email, or delete' }), { status: 400 });
    }

    // Get the organization
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { memberships: true },
    });

    if (!org) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), { status: 404 });
    }

    // Get the creator user for email functionality
    const creator = org.createdBy ? await prisma.user.findUnique({
      where: { id: org.createdBy },
      select: { email: true, firstName: true },
    }) : null;

    if (action === 'approve') {
      // Approve the organization
      const updatedOrg = await prisma.organization.update({
        where: { id: orgId },
        data: {
          status: 'approved',
          approvedBy: auth.userId,
          approvedAt: new Date(),
        },
      });

      // Assign roles to the creator: admin, org, and staff
      if (org.createdBy) {
        const roles = ['admin', 'org', 'staff'];

        for (const role of roles) {
          const existing = await prisma.membership.findUnique({
            where: {
              userId_orgId_role: {
                userId: org.createdBy,
                orgId: org.id,
                role,
              },
            },
          });

          if (!existing) {
            await prisma.membership.create({
              data: {
                userId: org.createdBy,
                orgId: org.id,
                role,
                status: 'accepted',
                approvedAt: new Date(),
                approvedBy: auth.userId,
              },
            });
          } else {
            await prisma.membership.update({
              where: {
                userId_orgId_role: {
                  userId: org.createdBy,
                  orgId: org.id,
                  role,
                },
              },
              data: {
                role: role === 'admin' ? 'admin' : role,
                status: 'accepted',
                approvedAt: new Date(),
                approvedBy: auth.userId,
              },
            });
          }
        }

        for (const role of ['admin', 'org']) {
          const existingStaff = await prisma.staff.findUnique({
            where: { userId: org.createdBy },
          });

          if (!existingStaff) {
            await prisma.staff.create({
              data: {
                userId: org.createdBy,
                organizationId: org.id,
                role,
                isActive: true,
                isVerified: true,
              },
            });
          }
        }
      }

      if (org.createdBy) {
        const creator = await prisma.user.findUnique({
          where: { id: org.createdBy },
        });

        if (creator) {
          await prisma.notification.create({
            data: {
              organizationId: org.id,
              targetId: org.createdBy,
              targetType: 'admin',
              eventType: 'organization_approved',
              title: 'Organization Approved! 🎉',
              body: `Your organization "${org.name}" has been approved by the development team. You now have access to the admin, organization, and staff dashboards.`, 
              deliveryChannels: ['email'],
              readAt: null,
            },
          });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Organization "${org.name}" has been approved`,
        organization: updatedOrg,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'suspend' || action === 'reactivate') {
      const newStatus = action === 'suspend' ? 'suspended' : 'approved';
      const updatedOrg = await prisma.organization.update({
        where: { id: orgId },
        data: {
          status: newStatus,
          updatedAt: new Date(),
        },
      });

      return new Response(JSON.stringify({
        success: true,
        message: `Organization "${org.name}" has been ${action === 'suspend' ? 'suspended' : 'reactivated'}`,
        organization: updatedOrg,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'email') {
      const { subject, message } = body as { subject?: string; message?: string };
      const recipient = org.email || creator?.email;

      if (!recipient) {
        return new Response(JSON.stringify({ error: 'No recipient email available for this organization' }), { status: 400 });
      }

      try {
        const { notify } = await import('@/app/api/notification/producer');
        await notify({
          to: recipient,
          channel: 'email',
          template: 'developer_org_message',
          data: {
            organizationName: org.name,
            subject: subject || `Update from TennisTracker Developer Support`,
            message: message || `Hello ${creator?.firstName || 'there'},\n\nThis is a message from the TennisTracker development team regarding your organization registration.`,
          },
        });
      } catch (notifyError) {
        console.warn('Failed to send developer email to organization:', notifyError);
        return new Response(JSON.stringify({ error: 'Failed to queue email message' }), { status: 500 });
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Email queued for ${recipient}`,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'reject') {
      // Reject the organization
      const updatedOrg = await prisma.organization.update({
        where: { id: orgId },
        data: {
          status: 'rejected',
          approvedBy: auth.userId,
          approvedAt: new Date(),
          rejectionReason: rejectionReason || 'No reason provided',
        },
      });

      if (org.createdBy) {
        const creator = await prisma.user.findUnique({
          where: { id: org.createdBy },
        });

        if (creator) {
          await prisma.notification.create({
            data: {
              organizationId: org.id,
              targetId: org.createdBy,
              targetType: 'admin',
              eventType: 'organization_rejected',
              title: 'Organization Registration Declined',
              body: `Your organization "${org.name}" registration was not approved. Reason: ${rejectionReason || 'Please contact support for more information.'}`,
              deliveryChannels: ['email'],
              readAt: null,
            },
          });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Organization "${org.name}" has been rejected`,
        organization: updatedOrg,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      // Permanently delete the organization and all related data
      await prisma.organization.delete({
        where: { id: orgId },
      });

      return new Response(JSON.stringify({
        success: true,
        message: `Organization "${org.name}" has been permanently deleted`,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error processing organization action:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

