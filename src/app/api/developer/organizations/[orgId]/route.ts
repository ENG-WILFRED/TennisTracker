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
    const { action, rejectionReason } = body as { action: 'approve' | 'reject'; rejectionReason?: string };

    if (!action || !['approve', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Action must be approve or reject' }), { status: 400 });
    }

    // Get the organization
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { memberships: true },
    });

    if (!org) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), { status: 404 });
    }

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

      // Assign roles to the creator: admin, org, and finance_officer
      if (org.createdBy) {
        const roles = ['admin', 'org', 'finance_officer'];

        for (const role of roles) {
          // Check if membership already exists
          const existing = await prisma.membership.findUnique({
            where: {
              userId_orgId: {
                userId: org.createdBy,
                orgId: org.id,
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
            // Update existing membership
            await prisma.membership.update({
              where: {
                userId_orgId: {
                  userId: org.createdBy,
                  orgId: org.id,
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

        // Also create Staff entries for admin and org roles
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

      // Create a notification for the organization creator
      if (org.createdBy) {
        const creator = await prisma.user.findUnique({
          where: { id: org.createdBy },
        });

        if (creator) {
          await prisma.notification.create({
            data: {
              organizationId: org.id,
              userId: org.createdBy,
              type: 'organization_approved',
              title: 'Organization Approved! 🎉',
              message: `Your organization "${org.name}" has been approved by the development team. You now have access to the admin, organization, and finance dashboards.`,
              read: false,
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
    } else {
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

      // Create a notification for the organization creator
      if (org.createdBy) {
        const creator = await prisma.user.findUnique({
          where: { id: org.createdBy },
        });

        if (creator) {
          await prisma.notification.create({
            data: {
              organizationId: org.id,
              userId: org.createdBy,
              type: 'organization_rejected',
              title: 'Organization Registration Declined',
              message: `Your organization "${org.name}" registration was not approved. Reason: ${rejectionReason || 'Please contact support for more information.'}`,
              read: false,
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
  } catch (error) {
    console.error('Error processing organization action:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
