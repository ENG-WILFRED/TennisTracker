import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(request: Request) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = auth.playerId;

    const memberships = await prisma.membership.findMany({
      where: { userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const clubMembers = await prisma.clubMember.findMany({
      where: { playerId: userId },
      include: {
        membershipTier: true,
      },
    });

    const clubMemberByOrg = new Map(clubMembers.map((clubMember) => [clubMember.organizationId, clubMember]));

    const formattedMemberships = memberships.map((membership) => ({
      id: membership.id,
      orgId: membership.orgId,
      orgName: membership.organization?.name || 'Unknown organization',
      role: membership.role,
      status: membership.status,
      joinedAt: membership.joinedAt.toISOString(),
      approvedAt: membership.approvedAt?.toISOString() || null,
      approvedBy: membership.approvedBy || null,
      clubMember: clubMemberByOrg.get(membership.orgId)
        ? {
            tier: clubMemberByOrg.get(membership.orgId)?.membershipTier?.name || null,
            monthlyPrice: clubMemberByOrg.get(membership.orgId)?.membershipTier?.monthlyPrice || null,
            paymentStatus: clubMemberByOrg.get(membership.orgId)?.paymentStatus || null,
          }
        : null,
    }));

    const activeMemberships = formattedMemberships.filter((membership) => membership.status === 'accepted');
    const pendingApplications = formattedMemberships.filter((membership) => membership.status === 'pending');
    const suspendedMemberships = formattedMemberships.filter((membership) => membership.status === 'suspended');
    const uniqueOrganizationCount = new Set(formattedMemberships.map((membership) => membership.orgId)).size;

    const notifications = [];
    if (pendingApplications.length > 0) {
      notifications.push({
        id: 'pending-memberships',
        title: 'Membership applications pending',
        message: `You have ${pendingApplications.length} application${pendingApplications.length === 1 ? '' : 's'} waiting for organization review.`,
      });
    }
    if (suspendedMemberships.length > 0) {
      notifications.push({
        id: 'suspended-memberships',
        title: 'Suspended memberships',
        message: `You have ${suspendedMemberships.length} suspended membership${suspendedMemberships.length === 1 ? '' : 's'}. Reach out to the organization admin for next steps.`,
      });
    }
    if (activeMemberships.length === 0 && pendingApplications.length === 0) {
      notifications.push({
        id: 'no-memberships',
        title: 'No active memberships',
        message: 'Browse organizations and request membership to gain access and community benefits.',
      });
    }

    const billing = {
      nextPayment: activeMemberships.length > 0 ? 'Check organization billing dashboard' : 'No active billing',
      monthlyEstimate: activeMemberships.length > 0 ? 'Tied to your active membership tiers' : 'Not available',
      note: 'Billing details are managed by each organization. Contact support for invoices or payment questions.',
    };

    return NextResponse.json({
      memberships: formattedMemberships,
      summary: {
        activeMemberships: activeMemberships.length,
        pendingApplications: pendingApplications.length,
        suspendedMemberships: suspendedMemberships.length,
        organizationCount: uniqueOrganizationCount,
      },
      notifications,
      billing,
    });
  } catch (error: any) {
    console.error('Failed to fetch user memberships:', error);
    return NextResponse.json({ error: 'Failed to fetch memberships' }, { status: 500 });
  }
}
