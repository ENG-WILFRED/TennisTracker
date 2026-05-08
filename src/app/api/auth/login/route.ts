import { NextResponse } from 'next/server';
import { loginPlayer } from '@/actions/auth';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import { UserRole } from '@/config/roles';
import bcrypt from 'bcryptjs';
import { recordEndpointMetrics } from '@/lib/monitoring';

/**
 * Get all available roles for a user based on active memberships
 * Includes inherited membership for kids through their parents/guardians
 */
async function getUserAvailableRoles(userId: string): Promise<{ role: UserRole; orgId: string; orgName: string; status: string; inheritedFrom?: string }[]> {
  // Run all queries in parallel for better performance
  const [
    memberships,
    clubMemberships,
    staffRecords,
    guardianships,
    ownedOrganizations
  ] = await Promise.all([
    prisma.membership.findMany({
      where: { userId, status: 'accepted' },
      include: { organization: true }
    }),
    prisma.clubMember.findMany({
      where: { playerId: userId, paymentStatus: 'active', role: { not: 'inactive' } },
      include: { organization: true }
    }),
    prisma.staff.findMany({
      where: { userId },
      include: { organization: true }
    }),
    prisma.guardian.findMany({
      where: { dependentId: userId, isApproved: true },
      include: { guardian: true }
    }),
    prisma.organization.findMany({
      where: { createdBy: userId },
      select: { id: true, name: true }
    })
  ]);

  const rolesMap = new Map<string, { role: UserRole; orgId: string; orgName: string; status: string; inheritedFrom?: string }>();

  // Add direct memberships
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

  // Add club memberships
  for (const clubMember of clubMemberships) {
    const key = `${clubMember.organizationId}:member`;
    if (!rolesMap.has(key)) {
      rolesMap.set(key, {
        role: 'member',
        orgId: clubMember.organizationId,
        orgName: clubMember.organization.name,
        status: 'accepted',
      });
    }
  }

  // Add inherited memberships from guardians (for kids) - optimized to avoid N+1 queries
  if (guardianships.length > 0) {
    const guardianIds = guardianships.map(g => g.guardianId);
    const guardianMemberships = await prisma.membership.findMany({
      where: {
        userId: { in: guardianIds },
        status: 'accepted'
      },
      include: {
        organization: true,
        user: { select: { firstName: true, lastName: true } }
      }
    });

    for (const membership of guardianMemberships) {
      const key = `${membership.orgId}:member:inherited`;
      if (!rolesMap.has(key)) {
        const guardian = guardianships.find(g => g.guardianId === membership.userId);
        const inheritedFrom = guardian ? `${guardian.guardian.firstName} ${guardian.guardian.lastName}` : undefined;
        
        rolesMap.set(key, {
          role: 'member',
          orgId: membership.orgId,
          orgName: membership.organization.name,
          status: 'accepted',
          inheritedFrom
        });
      }
    }
  }

  // Add staff roles (coaches, finance, admin, or other staff roles)
  for (const staff of staffRecords) {
    if (!staff.organizationId) {
      continue;
    }

    const orgName = staff.organization?.name || 'Platform';

    // Map specific staff roles to user roles
    let userRole: UserRole = 'staff';
    if (staff.role && staff.role.toLowerCase().includes('coach')) {
      userRole = 'coach';
    } else if (staff.role && staff.role.toLowerCase().includes('admin')) {
      userRole = 'admin';
    } else if (staff.role) {
      // For other staff roles, use the specific role from the database
      userRole = staff.role as UserRole;
    }

    const staffKey = `${staff.organizationId}:${userRole}`;
    if (!rolesMap.has(staffKey)) {
      rolesMap.set(staffKey, {
        role: userRole,
        orgId: staff.organizationId,
        orgName,
        status: 'accepted',
      });
    }
  }

  // Add organization ownership role for users who created organizations
  for (const org of ownedOrganizations) {
    const key = `${org.id}:org`;
    if (!rolesMap.has(key)) {
      rolesMap.set(key, {
        role: 'org' as UserRole,
        orgId: org.id,
        orgName: org.name,
        status: 'accepted',
      });
    }
  }

  const roles = Array.from(rolesMap.values());

  if (roles.length === 0) {
    roles.push({
      role: 'spectator',
      orgId: '',
      orgName: 'Platform',
      status: 'accepted',
    });
  }

  return roles;
}

export async function POST(request: Request) {
  const start = Date.now();
  let status = 200;

  try {
    const body = await request.json();
    const { usernameOrEmail, password, selectedRole } = body as any;

    if (!usernameOrEmail || !password) {
      return NextResponse.json({ error: 'Username/email and password are required' }, { status: 400 });
    }

    let user: any = null;
    let userId: string | null = null;

    // Hardcoded developer login for wilfred
    if (
      (usernameOrEmail === 'wilfred' || usernameOrEmail === 'vicotennis0@gmail.com') &&
      password === '123456'
    ) {
      user = {
        id: 'dev-wilfred',
        username: 'wilfred',
        email: 'vicotennis0@gmail.com',
        firstName: 'Wilfred',
        lastName: 'Developer',
        photo: null,
        role: 'developer',
      };
      userId = user.id;
    }

    // First try existing player login action
    try {
      user = await loginPlayer({ usernameOrEmail, password });
      userId = user.id;
    } catch (err) {
      // Not a player or failed login - try referee
    }

    // If player login failed, try referee login
    if (!user) {
      const referee = await prisma.referee.findFirst({
        where: {
          OR: [
            { user: { username: usernameOrEmail } },
            { user: { email: usernameOrEmail } },
          ],
        },
        include: { user: true },
      });

      if (!referee || !referee.user) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      const valid = await bcrypt.compare(password, referee.user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      user = {
        id: referee.user.id,
        username: referee.user.username,
        email: referee.user.email,
        firstName: referee.user.firstName,
        lastName: referee.user.lastName,
        photo: referee.user.photo || null,
      };
      userId = referee.user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Login failed' }, { status: 401 });
    }

    const userRecord =
      userId === 'dev-wilfred'
        ? null
        : await prisma.user.findUnique({
            where: { id: userId },
            select: { acceptedTermsAt: true },
          });
    const termsAccepted = userId === 'dev-wilfred' ? true : Boolean(userRecord?.acceptedTermsAt);

    let availableMemberships;

    if (userId === 'dev-wilfred') {
      availableMemberships = [
        {
          role: 'developer' as UserRole,
          orgId: '',
          orgName: 'Developer Console',
          status: 'accepted',
        },
      ];
    } else {
      // Organization owners are allowed to login even if they don't have club membership entries
      const isOrganizationOwner = Boolean(await prisma.organization.findFirst({ where: { createdBy: userId } }));

      // Block login for account-level suspension/dismissal/deactivation only for non-org users with club memberships
      const clubMemberships = await prisma.clubMember.findMany({ where: { playerId: userId } });
      if (!isOrganizationOwner && clubMemberships.length > 0) {
        const now = new Date();
        const hasActive = clubMemberships.some((cm: typeof clubMemberships[number]) =>
          cm.paymentStatus === 'active' &&
          cm.role !== 'inactive' &&
          (!cm.suspendedUntil || cm.suspendedUntil <= now)
        );

        if (!hasActive) {
          const isSuspended = clubMemberships.some((cm: typeof clubMemberships[number]) => cm.suspendedUntil && cm.suspendedUntil > now);
          const isDismissed = clubMemberships.some((cm: typeof clubMemberships[number]) => cm.role === 'inactive' && cm.paymentStatus === 'inactive');

          let message = 'Your account is currently inactive. Please contact your organization admin.';
          if (isSuspended) message = 'Your membership is suspended. Contact your organization admin for reactivation.';
          else if (isDismissed) message = 'You have been dismissed and cannot login. Contact support.';

          return NextResponse.json({ error: message }, { status: 403 });
        }
      }

      // Get available memberships for this user
      availableMemberships = await getUserAvailableRoles(userId);
    }

    // If only requesting available roles (for role selection screen)
    if (body.getRolesOnly === true) {
      return NextResponse.json({ availableRoles: availableMemberships, user });
    }

    const accessToken = generateAccessToken({ playerId: userId, email: user.email, username: user.username });
    const refreshToken = generateRefreshToken({ playerId: userId, email: user.email, username: user.username });

    // Base client user with membership details
    const clientUser: any = {
      ...user,
      id: userId,
      availableRoles: availableMemberships,
      memberships: availableMemberships,
      acceptedTerms: termsAccepted,
    };

    // If user has multiple active memberships, require role selection
    if (availableMemberships.length > 1) {
      return NextResponse.json({
        requiresRoleSelection: true,
        accessToken,
        refreshToken,
        user: clientUser,
      });
    }

    // Single membership or spectator - proceed with login
    const membership = availableMemberships[0];
    const roleToUse = membership.role;
    const orgId = membership.orgId || null;

    // Add role-specific data
    clientUser.role = roleToUse;
    clientUser.orgId = orgId;

    if (!termsAccepted) {
      return NextResponse.json({
        accessToken,
        refreshToken,
        requiresTermsAcceptance: true,
        user: clientUser,
      });
    }

    return NextResponse.json({ accessToken, refreshToken, user: clientUser });
  } catch (error: any) {
    status = error?.status || 500;
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
  } finally {
    recordEndpointMetrics('/api/auth/login', 'POST', status, Date.now() - start);
  }
}