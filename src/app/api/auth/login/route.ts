import { NextResponse } from 'next/server';
import { loginPlayer } from '@/actions/auth';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { PrismaClient } from '@/generated/prisma';
import { UserRole } from '@/config/roles';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Get all available roles for a user based on active memberships
 */
async function getUserAvailableRoles(userId: string): Promise<{ role: UserRole; orgId: string; orgName: string; status: string }[]> {
  const memberships = await prisma.membership.findMany({
    where: {
      userId,
      status: 'accepted'
    },
    include: {
      organization: true
    }
  });

  const roles: { role: UserRole; orgId: string; orgName: string; status: string }[] = memberships.map(membership => ({
    role: membership.role as UserRole,
    orgId: membership.orgId,
    orgName: membership.organization.name,
    status: membership.status,
  }));

  // If no active memberships, default to spectator
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
  try {
    const body = await request.json();
    const { usernameOrEmail, password, selectedRole } = body as any;

    if (!usernameOrEmail || !password) {
      return NextResponse.json({ error: 'Username/email and password are required' }, { status: 400 });
    }

    let user: any = null;
    let userId: string | null = null;

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

    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { acceptedTermsAt: true },
    });
    const termsAccepted = Boolean(userRecord?.acceptedTermsAt);

    // Organization owners are allowed to login even if they don't have club membership entries
    const isOrganizationOwner = Boolean(await prisma.organization.findFirst({ where: { createdBy: userId } }));

    // Block login for account-level suspension/dismissal/deactivation only for non-org users with club memberships
    const clubMemberships = await prisma.clubMember.findMany({ where: { playerId: userId } });
    if (!isOrganizationOwner && clubMemberships.length > 0) {
      const now = new Date();
      const hasActive = clubMemberships.some(cm =>
        cm.paymentStatus === 'active' &&
        cm.role !== 'inactive' &&
        (!cm.suspendedUntil || cm.suspendedUntil <= now)
      );

      if (!hasActive) {
        const isSuspended = clubMemberships.some(cm => cm.suspendedUntil && cm.suspendedUntil > now);
        const isDismissed = clubMemberships.some(cm => cm.role === 'inactive' && cm.paymentStatus === 'inactive');

        let message = 'Your account is currently inactive. Please contact your organization admin.';
        if (isSuspended) message = 'Your membership is suspended. Contact your organization admin for reactivation.';
        else if (isDismissed) message = 'You have been dismissed and cannot login. Contact support.';

        return NextResponse.json({ error: message }, { status: 403 });
      }
    }

    // Get available memberships for this user
    const availableMemberships = await getUserAvailableRoles(userId);

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
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
}