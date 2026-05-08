import bcrypt from 'bcryptjs';
import { PrismaClient } from '../../src/generated/prisma/index.js';

const prisma = new PrismaClient();

/**
 * Seed staff members across all departments with new staff dashboard system
 * Creates sample staff with proper department and role assignments
 */
export async function seedNewStaffSystem() {
  console.log('👨‍💼 Seeding new enterprise staff system...');

  try {
    const organizations = await prisma.organization.findMany({ take: 1 });

    if (organizations.length === 0) {
      console.log('⚠️  No organizations found. Skipping new staff seed.');
      return;
    }

    const org = organizations[0];
    const defaultPasswordHash = await bcrypt.hash('tennis123', 10);

    // Get or create test users for each department/role
    const staffData = [
      {
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin.platform@example.com',
        department: 'administration',
        role: 'admin',
        expertise: 'Platform Management',
      },
      // Finance Department
      {
        firstName: 'Alice',
        lastName: 'Finance',
        email: 'alice.finance@example.com',
        department: 'finance',
        role: 'finance_manager',
        expertise: 'Financial Management',
      },
      {
        firstName: 'Bob',
        lastName: 'Officer',
        email: 'bob.officer@example.com',
        department: 'finance',
        role: 'finance_officer',
        expertise: 'Account Management',
      },
      // HR Department
      {
        firstName: 'Carol',
        lastName: 'HR',
        email: 'carol.hr@example.com',
        department: 'hr',
        role: 'hr_manager',
        expertise: 'Human Resources',
      },
      {
        firstName: 'David',
        lastName: 'Employee',
        email: 'david.employee@example.com',
        department: 'hr',
        role: 'hr_officer',
        expertise: 'Employee Relations',
      },
      // Reception Department
      {
        firstName: 'Emma',
        lastName: 'Reception',
        email: 'emma.reception@example.com',
        department: 'reception',
        role: 'receptionist',
        expertise: 'Front Desk',
      },
      // Security Department
      {
        firstName: 'Frank',
        lastName: 'Security',
        email: 'frank.security@example.com',
        department: 'security',
        role: 'security_officer',
        expertise: 'Security Management',
      },
      {
        firstName: 'Grace',
        lastName: 'Guard',
        email: 'grace.guard@example.com',
        department: 'security',
        role: 'watchman',
        expertise: 'Facility Monitoring',
      },
      // Maintenance Department
      {
        firstName: 'Henry',
        lastName: 'Maintenance',
        email: 'henry.maintenance@example.com',
        department: 'maintenance',
        role: 'maintenance_manager',
        expertise: 'Facility Management',
      },
      {
        firstName: 'Iris',
        lastName: 'Technician',
        email: 'iris.technician@example.com',
        department: 'maintenance',
        role: 'maintenance_staff',
        expertise: 'Equipment Repair',
      },
      // Inventory Department
      {
        firstName: 'Jack',
        lastName: 'Inventory',
        email: 'jack.inventory@example.com',
        department: 'inventory',
        role: 'inventory_manager',
        expertise: 'Stock Management',
      },
      // Support Department
      {
        firstName: 'Karen',
        lastName: 'Support',
        email: 'karen.support@example.com',
        department: 'support',
        role: 'support_manager',
        expertise: 'Customer Support',
      },
      {
        firstName: 'Leo',
        lastName: 'Agent',
        email: 'leo.agent@example.com',
        department: 'support',
        role: 'support_staff',
        expertise: 'Support Services',
      },
      // Marketing Department
      {
        firstName: 'Maria',
        lastName: 'Marketing',
        email: 'maria.marketing@example.com',
        department: 'marketing',
        role: 'marketing_manager',
        expertise: 'Marketing Strategy',
      },
      // Operations Department
      {
        firstName: 'Nathan',
        lastName: 'Operations',
        email: 'nathan.operations@example.com',
        department: 'operations',
        role: 'operations_manager',
        expertise: 'Operations Management',
      },
    ];

    let createdCount = 0;

    for (const staffRecord of staffData) {
      try {
        // Check if user exists
        let user = await prisma.user.findUnique({
          where: { email: staffRecord.email },
        });

        // Create user if doesn't exist
        if (!user) {
          user = await prisma.user.create({
            data: {
              username: staffRecord.email.split('@')[0],
              email: staffRecord.email,
              firstName: staffRecord.firstName,
              lastName: staffRecord.lastName,
              passwordHash: defaultPasswordHash,
              country: 'Kenya',
            },
          });
          console.log(`  ✓ Created user: ${staffRecord.firstName} ${staffRecord.lastName}`);
        }

        // Check if staff record exists
        const existingStaff = await prisma.staff.findUnique({
          where: { userId: user.id },
        });

        if (!existingStaff) {
          // Create Staff record with department and role
          await prisma.staff.create({
            data: {
              userId: user.id,
              organizationId: org.id,
              role: staffRecord.role, // This is now the specialized department role
              expertise: staffRecord.expertise,
              coachingLevel: 'Professional',
              yearsOfExperience: Math.floor(Math.random() * 15) + 1,
              studentCount: 0,
              isActive: true,
              isVerified: true,
            },
          });

          createdCount++;
          console.log(`  ✓ ${staffRecord.firstName} added as ${staffRecord.role} in ${staffRecord.department}`);
        }
      } catch (err: any) {
        if (!err.message.includes('Unique constraint')) {
          console.log(`  ⚠️  Failed to create ${staffRecord.firstName}: ${err.message}`);
        }
      }
    }

    console.log(`\n✓ Created ${createdCount} new staff members in enterprise system`);
    return createdCount;
  } catch (error) {
    console.error('Error seeding new staff system:', error);
    throw error;
  }
}
