import { PrismaClient } from '../../src/generated/prisma/index.js';

const prisma = new PrismaClient();

export async function seedStaffDashboardData() {
  console.log('🛡️  Seeding staff dashboard sample data for security and gate logs...');

  const organizations = await prisma.organization.findMany({ take: 1 });
  if (organizations.length === 0) {
    console.log('⚠️  No organizations found. Skipping staff dashboard data seed.');
    return 0;
  }

  const organizationId = organizations[0].id;

  const existingLogs = await prisma.gateScanLog.count({ where: { organizationId } });
  const existingIncidents = await prisma.securityIncident.count({ where: { organizationId } });

  if (existingLogs > 0 || existingIncidents > 0) {
    console.log('⏭️  Staff dashboard logs or incidents already seeded. Skipping.');
    return 0;
  }

  const securityStaff = await prisma.staff.findFirst({
    where: {
      organizationId,
      role: { in: ['security_officer', 'watchman'] },
    },
  });

  const now = new Date();
  const today = new Date(now);
  today.setHours(8, 0, 0, 0);

  const gateScanData = [
    {
      id: 'scan-visitor-entry-001',
      staffId: securityStaff?.userId,
      name: 'Carl Mendes',
      scanType: 'visitor_entry',
      location: 'Main Gate',
      status: 'allowed',
      scannerId: 'scanner-main-01',
      organizationId,
      scannedAt: new Date(today.getTime() + 1000 * 60 * 5),
    },
    {
      id: 'scan-visitor-exit-001',
      staffId: securityStaff?.userId,
      name: 'Olivia Russo',
      scanType: 'visitor_exit',
      location: 'Reception Gate',
      status: 'allowed',
      scannerId: 'scanner-reception-01',
      organizationId,
      scannedAt: new Date(today.getTime() + 1000 * 60 * 30),
    },
    {
      id: 'scan-patrol-001',
      staffId: securityStaff?.userId,
      name: 'East Perimeter Check',
      scanType: 'patrol_check',
      location: 'East Entrance',
      status: 'complete',
      scannerId: 'scanner-east-01',
      organizationId,
      scannedAt: new Date(today.getTime() + 1000 * 60 * 45),
    },
    {
      id: 'scan-visitor-entry-002',
      staffId: securityStaff?.userId,
      name: 'Marcus Hall',
      scanType: 'visitor_entry',
      location: 'South Gate',
      status: 'allowed',
      scannerId: 'scanner-south-01',
      organizationId,
      scannedAt: new Date(today.getTime() + 1000 * 60 * 85),
    },
    {
      id: 'scan-patrol-002',
      staffId: securityStaff?.userId,
      name: 'Locker Room Sweep',
      scanType: 'patrol_check',
      location: 'Locker Halls',
      status: 'complete',
      scannerId: 'scanner-locker-01',
      organizationId,
      scannedAt: new Date(today.getTime() + 1000 * 60 * 110),
    },
  ];

  const incidentData = [
    {
      id: 'incident-001',
      summary: 'Unauthorized access attempt at East entrance',
      location: 'East entrance',
      severity: 'High',
      status: 'open',
      organizationId,
      reportedAt: new Date(today.getTime() + 1000 * 60 * 50),
    },
    {
      id: 'incident-002',
      summary: 'Suspicious package found near reception',
      location: 'Reception lobby',
      severity: 'Medium',
      status: 'open',
      organizationId,
      reportedAt: new Date(today.getTime() + 1000 * 60 * 65),
    },
    {
      id: 'incident-003',
      summary: 'Main door held open after hours',
      location: 'Main Gate',
      severity: 'Low',
      status: 'resolved',
      resolvedAt: new Date(today.getTime() + 1000 * 60 * 95),
      organizationId,
      reportedAt: new Date(today.getTime() + 1000 * 60 * 70),
    },
    {
      id: 'incident-004',
      summary: 'Unauthorized keycard swipe attempt',
      location: 'Staff Entrance',
      severity: 'Medium',
      status: 'open',
      organizationId,
      reportedAt: new Date(today.getTime() + 1000 * 60 * 105),
    },
  ];

  await prisma.gateScanLog.createMany({ data: gateScanData });
  await prisma.securityIncident.createMany({ data: incidentData });

  console.log(`✅ Seeded ${gateScanData.length} gate scan logs and ${incidentData.length} security incidents.`);
  return gateScanData.length + incidentData.length;
}
