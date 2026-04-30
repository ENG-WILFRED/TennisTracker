'use server';

import prisma from '@/lib/prisma';

export interface GuardianRelationship {
  id: string;
  guardianId: string;
  dependentId: string;
  relationship: string;
  isApproved: boolean;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  guardian?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    photo: string | null;
  };
  dependent?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    photo: string | null;
    dateOfBirth: Date | null;
  };
}

/**
 * Add a dependent (child) to a guardian (parent)
 */
export async function addDependent(
  guardianId: string,
  dependentId: string,
  relationship: 'parent' | 'guardian' | 'legal_guardian' = 'parent'
): Promise<GuardianRelationship> {
  // Verify both users exist
  const [guardian, dependent] = await Promise.all([
    prisma.user.findUnique({ where: { id: guardianId } }),
    prisma.user.findUnique({ where: { id: dependentId } })
  ]);

  if (!guardian) throw new Error('Guardian user not found');
  if (!dependent) throw new Error('Dependent user not found');

  // Create the relationship
  const guardianship = await prisma.guardian.create({
    data: {
      guardianId,
      dependentId,
      relationship,
      isApproved: true, // Auto-approve when guardian adds their own child
      approvedAt: new Date()
    },
    include: {
      guardian: {
        select: { id: true, firstName: true, lastName: true, email: true, photo: true }
      },
      dependent: {
        select: { id: true, firstName: true, lastName: true, email: true, photo: true, dateOfBirth: true }
      }
    }
  });

  return guardianship;
}

/**
 * Remove a dependent (child) from a guardian (parent)
 */
export async function removeDependent(guardianId: string, dependentId: string): Promise<void> {
  await prisma.guardian.delete({
    where: {
      guardianId_dependentId: {
        guardianId,
        dependentId
      }
    }
  });
}

/**
 * Get all dependents for a guardian
 */
export async function getDependents(guardianId: string): Promise<GuardianRelationship[]> {
  const dependents = await prisma.guardian.findMany({
    where: {
      guardianId,
      isApproved: true
    },
    include: {
      dependent: {
        select: { id: true, firstName: true, lastName: true, email: true, photo: true, dateOfBirth: true }
      }
    }
  });

  return dependents;
}

/**
 * Get all guardians for a dependent
 */
export async function getGuardians(dependentId: string): Promise<GuardianRelationship[]> {
  const guardians = await prisma.guardian.findMany({
    where: {
      dependentId,
      isApproved: true
    },
    include: {
      guardian: {
        select: { id: true, firstName: true, lastName: true, email: true, photo: true }
      }
    }
  });

  return guardians;
}

/**
 * Get inherited memberships for a dependent (through guardians)
 */
export async function getInheritedMemberships(dependentId: string) {
  const guardianships = await prisma.guardian.findMany({
    where: {
      dependentId,
      isApproved: true
    }
  });

  if (guardianships.length === 0) {
    return [];
  }

  const inheritedMemberships = [];

  for (const guardianship of guardianships) {
    const memberships = await prisma.membership.findMany({
      where: {
        userId: guardianship.guardianId,
        status: 'accepted'
      },
      include: {
        organization: true,
        user: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    for (const membership of memberships) {
      inheritedMemberships.push({
        ...membership,
        inheritedFrom: `${membership.user.firstName} ${membership.user.lastName}`,
        inheritedFromUserId: membership.userId
      });
    }
  }

  return inheritedMemberships;
}

/**
 * Check if a user can access an organization through inherited membership
 */
export async function hasInheritedOrgAccess(userId: string, orgId: string): Promise<boolean> {
  const inherited = await getInheritedMemberships(userId);
  return inherited.some(m => m.orgId === orgId && m.status === 'accepted');
}

/**
 * Get all members who can inherit from a guardian's memberships
 * (useful for bulk operations or reporting)
 */
export async function getDependentsByOrg(guardianId: string, orgId: string) {
  const dependents = await prisma.guardian.findMany({
    where: {
      guardianId,
      isApproved: true
    },
    include: {
      dependent: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          dateOfBirth: true
        }
      }
    }
  });

  // Check if guardian has membership in this org
  const guardianMembership = await prisma.membership.findFirst({
    where: {
      userId: guardianId,
      orgId,
      status: 'accepted'
    }
  });

  if (!guardianMembership) {
    return [];
  }

  return dependents.map(d => d.dependent);
}
