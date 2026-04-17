import { seedOrganizations } from './organizations.js';
import { seedUsers } from './users.js';
import { seedCourts } from './courts.js';
import { seedMemberships } from './memberships.js';
import { seedMatches } from './matches.js';
import { seedBookings } from './bookings.js';
import { seedEnhancedBookings } from './bookings-enhanced.js';
import { seedPaymentRecords } from './payments.js';
import { seedCommunity } from './community.js';
import { seedTournaments } from './tournaments.js';
import { seedStats } from './stats.js';
import { seedTournamentComments } from './tournament-comments.js';
import { seedStaffForAllOrgs } from './staff.js';
import { seedTournamentTasks } from './tournament-tasks.js';
import { seedTaskTemplates } from './task-templates-complete.js';
import { seedTournamentPlayers } from './tournament-players-seeding.js';
import { PrismaClient } from '../../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🌱 TENNIS TRACKER DATABASE SEEDING');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const context: Record<string, any> = {};

    const seedRunCount = await prisma.seedRun.count();
    if (seedRunCount === 0) {
      const [organizationCount, userCount, courtCount, memberCount, bookingCount, matchCount] = await Promise.all([
        prisma.organization.count(),
        prisma.user.count(),
        prisma.court.count(),
        prisma.clubMember.count(),
        prisma.courtBooking.count(),
        prisma.match.count(),
      ]);

      if (organizationCount > 0) {
        await prisma.seedRun.create({
          data: {
            name: 'organizations',
            label: 'Organizations',
            status: 'completed',
            details: `inferred from ${organizationCount} organization records`,
          },
        });
      }

      if (userCount > 0) {
        await prisma.seedRun.create({
          data: {
            name: 'users',
            label: 'Users & Roles',
            status: 'completed',
            details: `inferred from ${userCount} user records`,
          },
        });
      }

      if (courtCount > 0) {
        await prisma.seedRun.create({
          data: {
            name: 'courts',
            label: 'Courts',
            status: 'completed',
            details: `inferred from ${courtCount} court records`,
          },
        });
      }

      if (memberCount > 0) {
        await prisma.seedRun.create({
          data: {
            name: 'memberships',
            label: 'Memberships',
            status: 'completed',
            details: `inferred from ${memberCount} membership records`,
          },
        });
      }

      if (bookingCount > 0) {
        await prisma.seedRun.create({
          data: {
            name: 'bookings',
            label: 'Court Bookings',
            status: 'completed',
            details: `inferred from ${bookingCount} booking records`,
          },
        });
      }

      if (matchCount > 0) {
        await prisma.seedRun.create({
          data: {
            name: 'matches',
            label: 'Matches',
            status: 'completed',
            details: `inferred from ${matchCount} match records`,
          },
        });
      }
    }

    const ensureContext = async (key: 'organizations' | 'users' | 'courts') => {
      if (context[key]) {
        return context[key];
      }

      switch (key) {
        case 'organizations': {
          const orgs = await prisma.organization.findMany();
          context.organizations = orgs;
          return orgs;
        }
        case 'users': {
          const users = await prisma.user.findMany({
            include: {
              player: true,
              referee: true,
              staff: true,
              spectator: true,
            },
          });
          context.users = users;
          return users;
        }
        case 'courts': {
          const courts = await prisma.court.findMany();
          context.courts = courts;
          return courts;
        }
        default:
          return undefined;
      }
    };

    const steps = [
      {
        name: 'organizations',
        label: 'Organizations',
        execute: async () => {
          const organizations = await seedOrganizations();
          context.organizations = organizations;
          return organizations;
        },
      },
      {
        name: 'users',
        label: 'Users & Roles',
        execute: async () => {
          await ensureContext('organizations');
          const users = await seedUsers(context.organizations);
          context.users = users;
          return users;
        },
      },
      {
        name: 'courts',
        label: 'Courts',
        execute: async () => {
          await ensureContext('organizations');
          const courts = await seedCourts(context.organizations);
          context.courts = courts;
          return courts;
        },
      },
      {
        name: 'memberships',
        label: 'Memberships',
        execute: async () => {
          await ensureContext('organizations');
          await ensureContext('users');
          const memberships = await seedMemberships(context.organizations, context.users);
          context.memberships = memberships;
          return memberships;
        },
      },
      {
        name: 'bookings',
        label: 'Court Bookings',
        execute: async () => {
          await ensureContext('organizations');
          await ensureContext('users');
          await ensureContext('courts');
          const bookings = await seedBookings(context.organizations, context.users, context.courts);
          context.bookings = bookings;
          return bookings;
        },
      },
      {
        name: 'enhancedBookings',
        label: 'Enhanced Booking Data',
        execute: async () => {
          await ensureContext('organizations');
          await ensureContext('users');
          await ensureContext('courts');
          const enhancedBookings = await seedEnhancedBookings(context.organizations, context.users, context.courts);
          context.enhancedBookings = enhancedBookings;
          return enhancedBookings;
        },
      },
      {
        name: 'paymentRecords',
        label: 'Payment Records',
        execute: async () => {
          const payments = await seedPaymentRecords();
          context.payments = payments;
          return payments;
        },
      },
      {
        name: 'matches',
        label: 'Matches',
        execute: async () => {
          await ensureContext('users');
          const referees = context.users.filter((u: any) => u.referee);
          const matches = await seedMatches(context.users, referees);
          context.matches = matches;
          return matches;
        },
      },
      {
        name: 'community',
        label: 'Community',
        execute: async () => {
          await ensureContext('users');
          const community = await seedCommunity(context.users);
          context.community = community;
          return community;
        },
      },
      {
        name: 'tournaments',
        label: 'Tournaments',
        execute: async () => {
          const tournaments = await seedTournaments();
          context.tournaments = tournaments;
          return tournaments;
        },
      },
      {
        name: 'tournamentComments',
        label: 'Tournament Comments',
        execute: async () => {
          const tournamentComments = await seedTournamentComments();
          context.tournamentComments = tournamentComments;
          return tournamentComments;
        },
      },
      {
        name: 'stats',
        label: 'Player Statistics & Rankings',
        execute: async () => {
          const stats = await seedStats();
          context.stats = stats;
          return stats;
        },
      },
      {
        name: 'staffMembers',
        label: 'Staff Members',
        execute: async () => {
          const staff = await seedStaffForAllOrgs();
          context.staff = staff;
          return staff;
        },
      },
      {
        name: 'tournamentTasks',
        label: 'Tournament Tasks',
        execute: async () => {
          const tournamentTasks = await seedTournamentTasks();
          context.tournamentTasks = tournamentTasks;
          return tournamentTasks;
        },
      },
      {
        name: 'taskTemplates',
        label: 'Task Templates',
        execute: async () => {
          const taskTemplates = await seedTaskTemplates();
          context.taskTemplates = taskTemplates;
          return taskTemplates;
        },
      },
      {
        name: 'tournamentPlayers',
        label: 'Tournament Players',
        execute: async () => {
          const tournamentPlayers = await seedTournamentPlayers();
          context.tournamentPlayers = tournamentPlayers;
          return tournamentPlayers;
        },
      },
    ];

    for (const step of steps) {
      const existingRun = await prisma.seedRun.findUnique({
        where: { name: step.name },
      });

      if (existingRun?.status === 'completed') {
        console.log(`✅ Skipping ${step.label}: already executed`);
        continue;
      }

      console.log(`📍 STEP: ${step.label}`);
      console.log('───────────────────────────────────────────────────────────────');

      try {
        const result = await step.execute();
        await prisma.seedRun.upsert({
          where: { name: step.name },
          update: {
            status: 'completed',
            executedAt: new Date(),
            details: JSON.stringify({ summary: Array.isArray(result) ? result.length : typeof result === 'object' ? Object.keys(result).length : 'ok' }),
          },
          create: {
            name: step.name,
            label: step.label,
            status: 'completed',
            executedAt: new Date(),
            details: JSON.stringify({ summary: Array.isArray(result) ? result.length : typeof result === 'object' ? Object.keys(result).length : 'ok' }),
          },
        });
      } catch (stepError) {
        await prisma.seedRun.upsert({
          where: { name: step.name },
          update: {
            status: 'failed',
            executedAt: new Date(),
            details: JSON.stringify({ error: String(stepError) }),
          },
          create: {
            name: step.name,
            label: step.label,
            status: 'failed',
            executedAt: new Date(),
            details: JSON.stringify({ error: String(stepError) }),
          },
        });
        throw stepError;
      }
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✨ SEEDING COMPLETED SUCCESSFULLY!\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
