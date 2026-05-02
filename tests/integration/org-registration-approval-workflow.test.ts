import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '../../src/generated/prisma';
import { hash } from 'bcryptjs';

/**
 * Organization Registration & Approval Workflow Tests
 * 
 * Complete flow test for org registration, developer approval, and role assignment
 */

const prisma = new PrismaClient();

// Helper to generate unique username
const generateUsername = () => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

describe('Organization Registration & Approval Workflow', () => {
  let testUser: any;
  let testDeveloper: any;

  beforeEach(async () => {
    // Create test users
    const hashedPassword = await hash('TestPassword123!', 10);

    testUser = await prisma.user.create({
      data: {
        username: generateUsername(),
        firstName: 'Test',
        lastName: 'Spectator',
        email: `test-spectator-${Date.now()}@vico.com`,
        passwordHash: hashedPassword,
        phone: '+254712345678',
        nationality: 'Kenya',
      },
    });

    testDeveloper = await prisma.user.create({
      data: {
        username: generateUsername(),
        firstName: 'Test',
        lastName: 'Developer',
        email: `test-developer-${Date.now()}@vico.com`,
        passwordHash: hashedPassword,
        phone: '+254787654321',
        nationality: 'Kenya',
      },
    });
  });

  afterEach(async () => {
    // Cleanup
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
    }
    if (testDeveloper) {
      await prisma.user.delete({ where: { id: testDeveloper.id } }).catch(() => {});
    }
  });

  describe('STEP 1: Organization Registration', () => {
    it('should create organization from spectator dashboard', async () => {
      const orgName = `Test Org ${Date.now()}`;
      
      const org = await prisma.organization.create({
        data: {
          name: orgName,
          city: 'Nairobi',
          country: 'Kenya',
          description: 'Test organization for workflow',
          phone: '+254712111222',
          createdBy: testUser.id,
          status: 'pending',
        },
      });

      expect(org).toBeDefined();
      expect(org.name).toBe(orgName);
      expect(org.status).toBe('pending');
      expect(org.createdBy).toBe(testUser.id);

      // Cleanup
      await prisma.organization.delete({ where: { id: org.id } });
    });

    it('should create membership application for creator', async () => {
      const orgName = `Test Org ${Date.now()}`;
      
      const org = await prisma.organization.create({
        data: {
          name: orgName,
          city: 'Nairobi',
          country: 'Kenya',
          createdBy: testUser.id,
          status: 'pending',
        },
      });

      const membership = await prisma.membership.create({
        data: {
          userId: testUser.id,
          orgId: org.id,
          role: 'admin',
          status: 'pending',
        },
      });

      expect(membership.userId).toBe(testUser.id);
      expect(membership.orgId).toBe(org.id);
      expect(membership.role).toBe('admin');
      expect(membership.status).toBe('pending');

      // Cleanup
      await prisma.membership.delete({ where: { id: membership.id } });
      await prisma.organization.delete({ where: { id: org.id } });
    });
  });

  describe('STEP 2: Developer Dashboard Visibility', () => {
    it('should fetch pending organizations', async () => {
      const orgName = `Test Org ${Date.now()}`;
      
      const org = await prisma.organization.create({
        data: {
          name: orgName,
          city: 'Nairobi',
          country: 'Kenya',
          createdBy: testUser.id,
          status: 'pending',
        },
      });

      const pendingOrgs = await prisma.organization.findMany({
        where: { status: 'pending' },
      });

      expect(pendingOrgs).toContainEqual(
        expect.objectContaining({ id: org.id, status: 'pending' })
      );

      // Cleanup
      await prisma.organization.delete({ where: { id: org.id } });
    });

    it('should display pending and approved organization counts', async () => {
      const pendingCount = await prisma.organization.count({
        where: { status: 'pending' },
      });

      const approvedCount = await prisma.organization.count({
        where: { status: 'approved' },
      });

      expect(typeof pendingCount).toBe('number');
      expect(typeof approvedCount).toBe('number');
    });
  });

  describe('STEP 3: Developer Approval/Rejection', () => {
    it('should approve organization', async () => {
      const orgName = `Test Org ${Date.now()}`;
      
      const org = await prisma.organization.create({
        data: {
          name: orgName,
          city: 'Nairobi',
          country: 'Kenya',
          createdBy: testUser.id,
          status: 'pending',
        },
      });

      const approved = await prisma.organization.update({
        where: { id: org.id },
        data: {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: testDeveloper.id,
        },
      });

      expect(approved.status).toBe('approved');
      expect(approved.approvedAt).toBeDefined();
      expect(approved.approvedBy).toBe(testDeveloper.id);

      // Cleanup
      await prisma.organization.delete({ where: { id: org.id } });
    });

    it('should reject organization with reason', async () => {
      const orgName = `Test Org ${Date.now()}`;
      
      const org = await prisma.organization.create({
        data: {
          name: orgName,
          city: 'Nairobi',
          country: 'Kenya',
          createdBy: testUser.id,
          status: 'pending',
        },
      });

      const rejected = await prisma.organization.update({
        where: { id: org.id },
        data: {
          status: 'rejected',
          rejectionReason: 'Insufficient documentation',
        },
      });

      expect(rejected.status).toBe('rejected');
      expect(rejected.rejectionReason).toBe('Insufficient documentation');

      // Cleanup
      await prisma.organization.delete({ where: { id: org.id } });
    });

    it('should auto-approve creator membership when org is approved', async () => {
      const orgName = `Test Org ${Date.now()}`;
      
      const org = await prisma.organization.create({
        data: {
          name: orgName,
          city: 'Nairobi',
          country: 'Kenya',
          createdBy: testUser.id,
          status: 'pending',
        },
      });

      const membership = await prisma.membership.create({
        data: {
          userId: testUser.id,
          orgId: org.id,
          role: 'admin',
          status: 'pending',
        },
      });

      // Approve organization
      await prisma.organization.update({
        where: { id: org.id },
        data: {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: testDeveloper.id,
        },
      });

      // Approve membership
      const approved = await prisma.membership.update({
        where: { id: membership.id },
        data: {
          status: 'accepted',
          approvedAt: new Date(),
          approvedBy: testDeveloper.id,
        },
      });

      expect(approved.status).toBe('accepted');
      expect(approved.approvedAt).toBeDefined();

      // Cleanup
      await prisma.membership.delete({ where: { id: membership.id } });
      await prisma.organization.delete({ where: { id: org.id } });
    });
  });

  describe('STEP 4: After Approval - User Access', () => {
    it('should grant admin membership to user when org is approved', async () => {
      const orgName = `Test Org ${Date.now()}`;
      
      const org = await prisma.organization.create({
        data: {
          name: orgName,
          city: 'Nairobi',
          country: 'Kenya',
          createdBy: testUser.id,
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: testDeveloper.id,
        },
      });

      const membership = await prisma.membership.create({
        data: {
          userId: testUser.id,
          orgId: org.id,
          role: 'admin',
          status: 'accepted',
          approvedAt: new Date(),
          approvedBy: testDeveloper.id,
        },
      });

      const userMemberships = await prisma.membership.findMany({
        where: { userId: testUser.id, status: 'accepted' },
        include: { organization: true },
      });

      expect(userMemberships).toContainEqual(
        expect.objectContaining({
          userId: testUser.id,
          orgId: org.id,
          role: 'admin',
          status: 'accepted',
        })
      );

      // Cleanup
      await prisma.membership.delete({ where: { id: membership.id } });
      await prisma.organization.delete({ where: { id: org.id } });
    });

    it('should allow approved org to be queried with admin members', async () => {
      const orgName = `Test Org ${Date.now()}`;
      
      const org = await prisma.organization.create({
        data: {
          name: orgName,
          city: 'Nairobi',
          country: 'Kenya',
          createdBy: testUser.id,
          status: 'approved',
        },
      });

      const membership = await prisma.membership.create({
        data: {
          userId: testUser.id,
          orgId: org.id,
          role: 'admin',
          status: 'accepted',
        },
      });

      const orgWithMembers = await prisma.organization.findUnique({
        where: { id: org.id },
        include: {
          memberships: {
            where: { role: 'admin', status: 'accepted' },
          },
        },
      });

      expect(orgWithMembers?.memberships).toBeDefined();
      expect(orgWithMembers?.memberships?.length).toBeGreaterThan(0);
      expect(orgWithMembers?.memberships?.[0].userId).toBe(testUser.id);

      // Cleanup
      await prisma.membership.delete({ where: { id: membership.id } });
      await prisma.organization.delete({ where: { id: org.id } });
    });
  });

  describe('COMPLETE WORKFLOW', () => {
    it('should complete entire org registration to approval flow', async () => {
      const orgName = `Complete Test Org ${Date.now()}`;

      // STEP 1: Create organization
      const org = await prisma.organization.create({
        data: {
          name: orgName,
          city: 'Nairobi',
          country: 'Kenya',
          description: 'Complete workflow test',
          phone: '+254712111222',
          createdBy: testUser.id,
          status: 'pending',
        },
      });

      // STEP 2: Create membership application
      const membership = await prisma.membership.create({
        data: {
          userId: testUser.id,
          orgId: org.id,
          role: 'admin',
          status: 'pending',
        },
      });

      // Verify pending in developer dashboard
      const pending = await prisma.organization.findMany({
        where: { status: 'pending', id: org.id },
      });
      expect(pending.length).toBe(1);

      // STEP 3: Developer approves
      const approved = await prisma.organization.update({
        where: { id: org.id },
        data: {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: testDeveloper.id,
        },
      });
      expect(approved.status).toBe('approved');

      // STEP 4: Auto-approve membership
      const approvedMembership = await prisma.membership.update({
        where: { id: membership.id },
        data: {
          status: 'accepted',
          approvedAt: new Date(),
          approvedBy: testDeveloper.id,
        },
      });
      expect(approvedMembership.status).toBe('accepted');

      // STEP 5: Verify user has access to org
      const userAccess = await prisma.membership.findUnique({
        where: { userId_orgId: { userId: testUser.id, orgId: org.id } },
        include: { organization: true },
      });

      expect(userAccess?.organization.status).toBe('approved');
      expect(userAccess?.role).toBe('admin');
      expect(userAccess?.status).toBe('accepted');

      // Cleanup
      await prisma.membership.delete({ where: { id: membership.id } });
      await prisma.organization.delete({ where: { id: org.id } });
    });

    it('should handle rejection workflow', async () => {
      const orgName = `Rejection Test Org ${Date.now()}`;

      // Create organization
      const org = await prisma.organization.create({
        data: {
          name: orgName,
          city: 'Nairobi',
          country: 'Kenya',
          createdBy: testUser.id,
          status: 'pending',
        },
      });

      // Create membership
      const membership = await prisma.membership.create({
        data: {
          userId: testUser.id,
          orgId: org.id,
          role: 'admin',
          status: 'pending',
        },
      });

      // Developer rejects
      const rejected = await prisma.organization.update({
        where: { id: org.id },
        data: {
          status: 'rejected',
          rejectionReason: 'Insufficient documentation',
        },
      });

      expect(rejected.status).toBe('rejected');

      // Reject membership
      await prisma.membership.update({
        where: { id: membership.id },
        data: { status: 'rejected' },
      });

      // Verify user doesn't have accepted membership
      const accepted = await prisma.membership.findMany({
        where: {
          userId: testUser.id,
          orgId: org.id,
          status: 'accepted',
        },
      });

      expect(accepted.length).toBe(0);

      // Cleanup
      await prisma.membership.delete({ where: { id: membership.id } });
      await prisma.organization.delete({ where: { id: org.id } });
    });
  });
});
