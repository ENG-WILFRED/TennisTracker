import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function POST(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const auth = await verifyApiAuth(request);
    if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { orgId } = await params;
    const body = await request.json();
    const { fullName, email, role, tier } = body;

    // Validate required fields
    if (!fullName || !email || !role) {
      return new Response(JSON.stringify({ error: 'Full name, email, and role are required' }), { status: 400 });
    }

    // Validate role - staff roles don't need membership tiers
    if (!['player', 'coach', 'referee', 'member'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role. Must be player, coach, referee, or member' }), { status: 400 });
    }

    // Find or create the invited user
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { player: true },
    });

    type InvitedUser = { id: string; player?: { userId: string } | null };
    let invitedUser: InvitedUser | null = existingUser
      ? { id: existingUser.id, player: existingUser.player ? { userId: existingUser.player.userId } : null }
      : null;
    let playerId: string;

    if (!invitedUser) {
      const [firstName, ...lastNameParts] = fullName.trim().split(' ');
      const lastName = lastNameParts.join(' ') || '';

      const newUser = await prisma.user.create({
        data: {
          username: `${email.toLowerCase().split('@')[0]}${Date.now()}`,
          email: email.toLowerCase(),
          firstName,
          lastName,
          passwordHash: '',
        },
      });

      invitedUser = { id: newUser.id, player: null };
      playerId = newUser.id;
    } else {
      playerId = invitedUser.player?.userId || invitedUser.id;
    }

    if (!invitedUser) {
      return new Response(JSON.stringify({ error: 'Unable to create or find invited user' }), { status: 500 });
    }

    // For staff roles (player, coach, referee), create organizational membership
    if (['player', 'coach', 'referee'].includes(role)) {
      // Ensure player record exists for player role
      if (role === 'player' && !existingUser?.player) {
        const player = await prisma.player.create({
          data: {
            userId: invitedUser.id,
            organizationId: orgId,
          },
        });
        playerId = player.userId;
      }

      // Check if user already has this organizational role
      const existingMembership = await prisma.membership.findUnique({
        where: {
          userId_orgId: {
            userId: invitedUser.id,
            orgId,
          },
        },
      });

      if (existingMembership) {
        return new Response(JSON.stringify({ error: `User already has a role in this organization` }), { status: 409 });
      }

      // Create organizational membership
      const membership = await prisma.membership.create({
        data: {
          userId: invitedUser.id,
          orgId,
          role,
          status: 'accepted', // Staff roles are auto-approved
          joinedAt: new Date(),
          approvedAt: new Date(),
          approvedBy: auth.playerId,
        },
      });

      return new Response(JSON.stringify({
        success: true,
        message: `${role} role assigned to ${email}`,
        membershipId: membership.id,
      }), { status: 200 });
    }

    // For regular members, require a membership tier
    if (!tier) {
      return new Response(JSON.stringify({ error: 'Membership tier is required for member role' }), { status: 400 });
    }

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), { status: 404 });
    }

    // Check if user is authorized (organization admin/owner)
    const isOwner = organization.createdBy === auth.playerId;
    const isAdmin = await prisma.clubMember.findFirst({
      where: {
        organizationId: orgId,
        playerId: auth.playerId,
        role: 'admin',
      },
    });

    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: 'You do not have permission to invite members' }), { status: 403 });
    }

    // Ensure player record exists for membership creation
    if (!existingUser?.player) {
      const player = await prisma.player.create({
        data: {
          userId: invitedUser.id,
          organizationId: orgId,
        },
      });
      playerId = player.userId;
    }

    const existingMembership = await prisma.clubMember.findFirst({
      where: {
        organizationId: orgId,
        playerId,
      },
    });

    if (existingMembership) {
      return new Response(JSON.stringify({ error: 'This email is already a member of the organization' }), { status: 409 });
    }

    // Get membership tier
    const membershipTier = await prisma.membershipTier.findFirst({
      where: {
        organizationId: orgId,
        name: tier,
      },
    });

    if (!membershipTier) {
      return new Response(JSON.stringify({ error: `Membership tier '${tier}' not found` }), { status: 400 });
    }

    // Check if user is already a paying member
    const existingMember = await prisma.clubMember.findFirst({
      where: {
        organizationId: orgId,
        playerId: playerId,
      },
    });

    if (existingMember) {
      return new Response(JSON.stringify({ error: 'User is already a paying member of this organization' }), { status: 409 });
    }

    // Create club membership with pending status
    const membership = await prisma.clubMember.create({
      data: {
        organizationId: orgId,
        playerId: playerId,
        tierId: membershipTier.id,
        role: 'member', // Regular paying members have 'member' role
        paymentStatus: 'pending', // Pending until invitation is accepted and payment is made
        joinDate: new Date(),
      },
    });

    // TODO: Send invitation email
    // For now, we'll just return success
    // In a real implementation, you'd send an email with an invitation link

    console.log(`Invitation sent to ${email} for organization ${orgId}, membership ID: ${membership.id}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Invitation sent to ${email}`,
      membershipId: membership.id,
    }), { status: 200 });

  } catch (error: any) {
    console.error('Invite member error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to send invitation' }), { status: 500 });
  }
}