'use server';

import prisma from '@/lib/prisma';

/**
 * Validate that a coach has an organization assigned
 * Coaches MUST belong to an organization
 */
export async function validateCoachHasOrg(coachId: string): Promise<{ hasOrg: boolean; orgId?: string; orgName?: string }> {
  const coach = await prisma.staff.findUnique({
    where: { userId: coachId },
    include: { organization: true }
  });

  if (!coach) {
    throw new Error('Coach not found');
  }

  if (!coach.role || !coach.role.toLowerCase().includes('coach')) {
    throw new Error('User is not a coach');
  }

  if (!coach.organizationId || !coach.organization) {
    return { hasOrg: false };
  }

  return {
    hasOrg: true,
    orgId: coach.organizationId,
    orgName: coach.organization.name
  };
}

/**
 * Assign a coach to an organization
 * This ensures coaches have mandatory org membership
 */
export async function assignCoachToOrg(coachId: string, orgId: string) {
  // Verify coach exists
  const coach = await prisma.staff.findUnique({
    where: { userId: coachId }
  });

  if (!coach) {
    throw new Error('Coach not found');
  }

  if (!coach.role || !coach.role.toLowerCase().includes('coach')) {
    throw new Error('User is not a coach');
  }

  // Verify organization exists
  const org = await prisma.organization.findUnique({
    where: { id: orgId }
  });

  if (!org) {
    throw new Error('Organization not found');
  }

  // Update coach's organization
  const updatedCoach = await prisma.staff.update({
    where: { userId: coachId },
    data: { organizationId: orgId },
    include: { organization: true }
  });

  // Optionally: Create a membership record if it doesn't exist
  const existingMembership = await prisma.membership.findUnique({
    where: {
      userId_orgId: {
        userId: coachId,
        orgId
      }
    }
  });

  if (!existingMembership) {
    await prisma.membership.create({
      data: {
        userId: coachId,
        orgId,
        role: 'coach',
        status: 'accepted',
        approvedAt: new Date()
      }
    });
  }

  return updatedCoach;
}

/**
 * Get all coaches without an organization (for admin dashboard)
 */
export async function getCoachesWithoutOrg() {
  const coachesWithoutOrg = await prisma.staff.findMany({
    where: {
      role: { contains: 'coach', mode: 'insensitive' },
      organizationId: null
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          photo: true
        }
      }
    }
  });

  return coachesWithoutOrg;
}

/**
 * Get all coaches for an organization
 */
export async function getOrgCoaches(orgId: string) {
  const coaches = await prisma.staff.findMany({
    where: {
      organizationId: orgId,
      role: { contains: 'coach', mode: 'insensitive' }
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          photo: true,
          bio: true
        }
      }
    }
  });

  return coaches;
}

/**
 * Check if a coach belongs to the same organization as a player
 */
export async function isCoachInPlayerOrg(coachId: string, playerId: string): Promise<boolean> {
  const coach = await prisma.staff.findUnique({
    where: { userId: coachId }
  });

  const player = await prisma.player.findUnique({
    where: { userId: playerId }
  });

  if (!coach || !player) return false;

  // Check if both have the same organizationId
  if (coach.organizationId && player.organizationId && coach.organizationId === player.organizationId) {
    return true;
  }

  // Check if player has membership in coach's org
  if (coach.organizationId) {
    const membership = await prisma.membership.findFirst({
      where: {
        userId: playerId,
        orgId: coach.organizationId,
        status: 'accepted'
      }
    });

    if (membership) return true;

    // Also check for inherited membership (if player is a dependent)
    const guardianships = await prisma.guardian.findMany({
      where: {
        dependentId: playerId,
        isApproved: true
      }
    });

    for (const guardianship of guardianships) {
      const guardianMembership = await prisma.membership.findFirst({
        where: {
          userId: guardianship.guardianId,
          orgId: coach.organizationId,
          status: 'accepted'
        }
      });

      if (guardianMembership) return true;
    }
  }

  return false;
}
