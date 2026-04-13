import { NextResponse } from 'next/server';
import { loginPlayer } from '@/actions/auth';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { PrismaClient } from '@/generated/prisma';
import { UserRole } from '@/config/roles';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Get all available roles for a user
 */
async function getUserAvailableRoles(userId: string): Promise<UserRole[]> {
  const roles: UserRole[] = [];

  // Check if player
  const player = await prisma.player.findUnique({ where: { userId } });
  if (player) {
    roles.push('player');
  }

  // Check if referee
  const referee = await prisma.referee.findUnique({ where: { userId } });
  if (referee) {
    roles.push('referee');
  }

  // Check if staff/coach
  const staff = await prisma.staff.findUnique({ where: { userId } });
  if (staff) {
    roles.push('coach');
  }

  // Check if organization owner
  const org = await prisma.organization.findFirst({ where: { createdBy: userId } });
  if (org) {
    roles.push('org');
  }

  // Check if admin or finance officer in any organization
  const clubMemberships = await prisma.clubMember.findMany({
    where: { playerId: userId },
    include: { organization: true },
  });

  clubMemberships.forEach((member) => {
    if (member.role === 'admin' && !roles.includes('admin')) {
      roles.push('admin');
    }
    if (member.role === 'finance_officer' && !roles.includes('finance_officer')) {
      roles.push('finance_officer');
    }
  });

  // Default to player if no roles found
  if (roles.length === 0) {
    roles.push('player');
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

    // Get available roles for this user
    const availableRoles = await getUserAvailableRoles(userId);

    // If only requesting available roles (for role selection screen)
    if (body.getRolesOnly === true) {
      return NextResponse.json({ availableRoles, user });
    }

    // Validate selected role if provided
    let roleToUse = selectedRole || availableRoles[0];
    if (!availableRoles.includes(roleToUse)) {
      roleToUse = availableRoles[0];
    }

    const accessToken = generateAccessToken({ playerId: userId, email: user.email, username: user.username });
    const refreshToken = generateRefreshToken({ playerId: userId, email: user.email, username: user.username });

    // Add role-specific data
    const clientUser: any = {
      ...user,
      id: userId,
      role: roleToUse,
      availableRoles,
      acceptedTerms: termsAccepted,
    };

    // Add organization ID if org role
    if (roleToUse === 'org') {
      const org = await prisma.organization.findFirst({ where: { createdBy: userId } });
      if (org) {
        clientUser.organizationId = org.id;
      }
    }

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