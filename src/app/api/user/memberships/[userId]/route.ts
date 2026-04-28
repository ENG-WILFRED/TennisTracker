import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@/config/roles';

/**
 * Get user memberships and available roles
 */
export async function GET(req: Request, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, photo: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get organization memberships
    const memberships = await prisma.membership.findMany({
      where: {
        userId,
        status: 'accepted',
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    // Get club memberships
    const clubMemberships = await prisma.clubMember.findMany({
      where: {
        playerId: userId,
        paymentStatus: 'active',
        role: { not: 'inactive' },
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    // Get staff role if exists
    const staffRecord = await prisma.staff.findUnique({
      where: { userId },
      select: { role: true, organizationId: true },
    });

    const rolesMap = new Map<string, { role: UserRole; orgId: string; orgName: string; status: string }>();

    // Add membership roles
    for (const membership of memberships) {
      const key = `${membership.orgId}:${membership.role}`;
      if (!rolesMap.has(key)) {
        rolesMap.set(key, {
          role: membership.role as UserRole,
          orgId: membership.orgId,
          orgName: membership.organization.name,
          status: membership.status,
        });
      }
    }

    // Add club memberships as 'member' role
    for (const clubMember of clubMemberships) {
      const key = `${clubMember.organizationId}:member`;
      if (!rolesMap.has(key)) {
        rolesMap.set(key, {
          role: 'member' as UserRole,
          orgId: clubMember.organizationId,
          orgName: clubMember.organization.name,
          status: 'accepted',
        });
      }
    }

    // Add staff role as coach if exists
    if (staffRecord?.role.includes('Coach')) {
      const orgId = staffRecord.organizationId || '';
      const key = `${orgId}:coach`;
      if (!rolesMap.has(key)) {
        const org = await prisma.organization.findUnique({
          where: { id: orgId },
          select: { name: true },
        });
        rolesMap.set(key, {
          role: 'coach' as UserRole,
          orgId,
          orgName: org?.name || 'Platform',
          status: 'accepted',
        });
      }
    }

    const roles = Array.from(rolesMap.values());

    if (roles.length === 0) {
      roles.push({
        role: 'spectator' as UserRole,
        orgId: '',
        orgName: 'Platform',
        status: 'accepted',
      });
    }

    return NextResponse.json({
      user,
      memberships: roles,
      availableRoles: roles,
    });
  } catch (error) {
    console.error('[User Memberships API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user memberships' },
      { status: 500 }
    );
  }
}
