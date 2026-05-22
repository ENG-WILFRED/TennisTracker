import { PrismaClient } from '../../src/generated/prisma/index.js';

const prisma = new PrismaClient();

export async function seedAdminDashboardData() {
  console.log('📊 Seeding admin dashboard operational data (maintenance, incidents, inventory)...');

  const organizations = await prisma.organization.findMany({ take: 1 });
  if (organizations.length === 0) {
    console.log('⚠️  No organizations found. Skipping admin dashboard data seed.');
    return 0;
  }

  const organizationId = organizations[0].id;

  // Check what data already exists
  const existingComplaints = await prisma.courtComplaint.count({ where: { court: { organizationId } } });
  const existingIncidents = await prisma.securityIncident.count({ where: { organizationId } });
  const existingInventory = await prisma.inventoryItem.count({ where: { organizationId } });

  let totalSeeded = 0;

  // Get organization's courts and owner
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      courts: { take: 5 },
    },
  });

  if (!org || org.courts.length === 0) {
    console.log('⚠️  Organization has no courts. Skipping admin dashboard data seed.');
    return 0;
  }

  const courts = org.courts;
  const orgOwner = org.createdBy ? await prisma.user.findUnique({
    where: { id: org.createdBy },
  }) : null;

  // Seed maintenance complaints (CourtComplaints with maintenance/condition categories)
  let createdComplaints = { count: 0 };
  if (existingComplaints === 0) {
    const maintenanceComplaints = [
      {
        courtId: courts[0].id,
        authorId: orgOwner?.id || courts[0].id,
        title: 'Broken Court Lighting',
        description: 'Lights on Court 1 not working properly, affecting evening play. Urgent repair needed.',
        category: 'maintenance',
        severity: 'high',
        status: 'pending',
      },
      {
        courtId: courts[1]?.id || courts[0].id,
        authorId: orgOwner?.id || courts[0].id,
        title: 'Water Supply Issue',
        description: 'Water pressure low at water station near Court 3. Cannot fill water containers.',
        category: 'maintenance',
        severity: 'high',
        status: 'pending',
      },
      {
        courtId: courts[2]?.id || courts[0].id,
        authorId: orgOwner?.id || courts[0].id,
        title: 'Court Surface Crack',
        description: 'Small crack visible in Court 5 near baseline. Should monitor for expansion.',
        category: 'condition',
        severity: 'medium',
        status: 'pending',
      },
      {
        courtId: courts[0].id,
        authorId: orgOwner?.id || courts[0].id,
        title: 'AC Unit Not Cooling',
        description: 'Air conditioning in admin office not maintaining temperature. Getting too warm.',
        category: 'facility',
        severity: 'medium',
        status: 'resolved',
        resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ];

    createdComplaints = await prisma.courtComplaint.createMany({
      data: maintenanceComplaints,
    });
  }

  console.log(`  ✅ Created ${createdComplaints.count} maintenance complaints`);
  totalSeeded += createdComplaints.count;

  const now = new Date();

  // Seed security incidents
  let createdIncidents = { count: 0 };
  if (existingIncidents === 0) {
    const securityIncidents = [
      {
        summary: 'Unauthorized access attempt at East entrance',
        location: 'East Gate',
        severity: 'High',
        status: 'open',
        organizationId,
        reportedById: orgOwner?.id,
        reportedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      },
      {
        summary: 'Suspicious visitor loitering near equipment storage',
        location: 'Equipment Storage Area',
        severity: 'Medium',
        status: 'open',
        organizationId,
        reportedById: orgOwner?.id,
        reportedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      },
      {
        summary: 'Staff member late to shift',
        location: 'Main Entrance',
        severity: 'Low',
        status: 'resolved',
        organizationId,
        reportedById: orgOwner?.id,
        reportedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        resolvedAt: new Date(now.getTime() - 22 * 60 * 60 * 1000),
      },
      {
        summary: 'Court reservation system error during peak hours',
        location: 'Reception Desk',
        severity: 'Medium',
        status: 'resolved',
        organizationId,
        reportedById: orgOwner?.id,
        reportedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
        resolvedAt: new Date(now.getTime() - 47 * 60 * 60 * 1000),
      },
    ];

    createdIncidents = await prisma.securityIncident.createMany({
      data: securityIncidents,
    });
  }

  console.log(`  ✅ Created ${createdIncidents.count} security incidents`);
  totalSeeded += createdIncidents.count;

  // Seed inventory items
  let createdInventory = { count: 0 };
  if (existingInventory === 0) {
    const inventoryItems = [
      {
        organizationId,
        name: 'Tennis Balls',
        description: 'Professional pressurized tennis balls',
        count: 150,
        unit: 'boxes',
        condition: 'good',
        location: 'Storage Room A',
        lastCheckedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        expiryDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
      },
      {
        organizationId,
        name: 'Court Markings Paint',
        description: 'Line marking paint for court surfaces',
        count: 5,
        unit: 'gallons',
        condition: 'good',
        location: 'Storage Room B',
        lastCheckedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        expiryDate: new Date(now.getTime() + 2 * 365 * 24 * 60 * 60 * 1000),
      },
      {
        organizationId,
        name: 'Safety Equipment',
        description: 'First aid kits and safety gear',
        count: 45,
        unit: 'items',
        condition: 'excellent',
        location: 'Clinic',
        lastCheckedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        expiryDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
      },
      {
        organizationId,
        name: 'Court Lights - Bulbs',
        description: 'LED replacement bulbs for court lighting',
        count: 8,
        unit: 'bulbs',
        condition: 'good',
        location: 'Maintenance Storage',
        lastCheckedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        expiryDate: new Date(now.getTime() + 5 * 365 * 24 * 60 * 60 * 1000),
      },
      {
        organizationId,
        name: 'Water Bottles',
        description: 'Reusable water bottles for members',
        count: 120,
        unit: 'bottles',
        condition: 'good',
        location: 'Vending Area',
        lastCheckedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        expiryDate: null,
      },
      {
        organizationId,
        name: 'Cleaning Supplies',
        description: 'Court cleaning and sanitizing supplies',
        count: 18,
        unit: 'sets',
        condition: 'good',
        location: 'Cleaning Storage',
        lastCheckedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        expiryDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
      },
    ];

    createdInventory = await prisma.inventoryItem.createMany({
      data: inventoryItems,
    });
  }

  console.log(`  ✅ Created ${createdInventory.count} inventory items`);
  totalSeeded += createdInventory.count;

  console.log(`\n✅ Admin dashboard data seeding complete! (${totalSeeded} total records)`);
  return totalSeeded;
}
