import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@/config/roles';

async function getUserAvailableRoles(userId: string) {
  const [memberships, clubMemberships, staffRecords, guardianships, ownedOrganizations] = await Promise.all([
    prisma.membership.findMany({ where: { userId, status: 'accepted' }, include: { organization: true } }),
    prisma.clubMember.findMany({ where: { playerId: userId, paymentStatus: 'active', role: { not: 'inactive' } }, include: { organization: true } }),
    prisma.staff.findMany({ where: { userId }, include: { organization: true } }),
    prisma.guardian.findMany({ where: { dependentId: userId, isApproved: true }, include: { guardian: true } }),
    prisma.organization.findMany({ where: { createdBy: userId }, select: { id: true, name: true } }),
  ]);

  const rolesMap = new Map();

  for (const membership of memberships) {
    const key = `${membership.orgId}:${membership.role}`;
    if (!rolesMap.has(key)) rolesMap.set(key, { role: membership.role, orgId: membership.orgId, orgName: membership.organization.name, status: membership.status });
  }

  for (const clubMember of clubMemberships) {
    const key = `${clubMember.organizationId}:member`;
    if (!rolesMap.has(key)) rolesMap.set(key, { role: 'member', orgId: clubMember.organizationId, orgName: clubMember.organization.name, status: 'accepted' });
  }

  if (guardianships.length > 0) {
    const guardianIds = guardianships.map((g) => g.guardianId);
    const guardianMemberships = await prisma.membership.findMany({ where: { userId: { in: guardianIds }, status: 'accepted' }, include: { organization: true, user: { select: { firstName: true, lastName: true } } } });
    for (const membership of guardianMemberships) {
      const key = `${membership.orgId}:member:inherited`;
      if (!rolesMap.has(key)) {
        rolesMap.set(key, { role: 'member', orgId: membership.orgId, orgName: membership.organization.name, status: 'accepted', inheritedFrom: undefined });
      }
    }
  }

  for (const staff of staffRecords) {
    if (!staff.organizationId) continue;
    let userRole = 'staff';
    if (staff.role && staff.role.toLowerCase().includes('coach')) userRole = 'coach';
    else if (staff.role && staff.role.toLowerCase().includes('admin')) userRole = 'admin';
    const staffKey = `${staff.organizationId}:${userRole}`;
    if (!rolesMap.has(staffKey)) rolesMap.set(staffKey, { role: userRole, orgId: staff.organizationId, orgName: staff.organization?.name || 'Platform', status: 'accepted' });
  }

  for (const org of ownedOrganizations) {
    const key = `${org.id}:org`;
    if (!rolesMap.has(key)) rolesMap.set(key, { role: 'org', orgId: org.id, orgName: org.name, status: 'accepted' });
  }

  const roles = Array.from(rolesMap.values());
  if (roles.length === 0) roles.push({ role: 'spectator', orgId: '', orgName: 'Platform', status: 'accepted' });
  return roles;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (user.isDeveloper) {
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          photo: user.photo,
          profileComplete: user.profileComplete ?? true,
        },
        availableRoles: [
          {
            role: 'developer' as UserRole,
            orgId: '',
            orgName: 'Developer Console',
            status: 'accepted',
          },
        ],
      });
    }

    const availableRoles = await getUserAvailableRoles(userId);

    return NextResponse.json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, username: user.username, photo: user.photo, profileComplete: user.profileComplete ?? true }, availableRoles });
  } catch (error: any) {
    console.error('OAuth roles error:', error);
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}
