import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function POST(request: Request, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const auth = verifyApiAuth(request);
    if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { orgId } = await params;
    const body = await request.json();
    const { fullName, email, role, tier } = body;

    // Validate required fields
    if (!fullName || !email || !role) {
      return new Response(JSON.stringify({ error: 'Full name, email, and role are required' }), { status: 400 });
    }

    // Validate role
    if (!['player', 'coach', 'referee'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role. Must be player, coach, or referee' }), { status: 400 });
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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { player: true },
    });

    let playerId: string;

    if (existingUser) {
      playerId = existingUser.player?.userId || existingUser.id;

      // Check if user is already a member of this organization
      const existingMembership = await prisma.clubMember.findUnique({
        where: {
          organizationId_playerId: {
            organizationId: orgId,
            playerId: playerId,
          },
        },
      });

      if (existingMembership) {
        return new Response(JSON.stringify({ error: 'This email is already a member of the organization' }), { status: 409 });
      }
    } else {
      // Create new user account
      const [firstName, ...lastNameParts] = fullName.trim().split(' ');
      const lastName = lastNameParts.join(' ') || '';

      const newUser = await prisma.user.create({
        data: {
          username: email.toLowerCase().split('@')[0] + Date.now(), // Temporary username
          email: email.toLowerCase(),
          firstName,
          lastName,
          passwordHash: '', // Will be set when user accepts invitation
        },
      });

      // Create player record
      const player = await prisma.player.create({
        data: {
          userId: newUser.id,
          organizationId: orgId,
        },
      });

      playerId = newUser.id;
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

    // Create club membership with pending status
    const membership = await prisma.clubMember.create({
      data: {
        organizationId: orgId,
        playerId: playerId,
        tierId: membershipTier.id,
        role: role,
        paymentStatus: 'pending', // Pending until invitation is accepted
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