// ═══════════════════════════════════════════════════════════════════════════════
// ENABLED SEEDS - These will run during seeding
// ═══════════════════════════════════════════════════════════════════════════════
import { seedOrganizations } from './seeds/organizations.js';
import { seedUsers } from './seeds/users.js';
import { seedCourts } from './seeds/courts.js';
import { seedMemberships } from './seeds/memberships.js';

// ═══════════════════════════════════════════════════════════════════════════════
// DISABLED SEEDS - Large data seeds (commented out to prevent excessive seeding)
// These are available if needed. Uncomment the imports and add to main() to enable.
// ═══════════════════════════════════════════════════════════════════════════════
// import { seedTournaments } from './seeds/tournaments.js';
// import { seedMatches } from './seeds/matches.js';
// import { seedCoachSessions } from './seeds/seeds/coach-sessions.js';
// import { seedPayments } from './seeds/payments.js';
// import { seedStats } from './seeds/stats.js';
// import { seedCommunity } from './seeds/community.js';
// import { seedBookingsEnhanced } from './seeds/bookings-enhanced.js';
// import { seedTournamentPlayers } from './seeds/tournament-players-seeding.js';
// import { seedTournamentTasks } from './seeds/tournament-tasks.js';
// import { seedTournamentComments } from './seeds/tournament-comments.js';
// import { seedTaskTemplates } from './seeds/task-templates-complete.js';
// import { seedStaffDashboard } from './seeds/staff-dashboard-data.js';
// import { seedStaffNewSystem } from './seeds/staff-new-system.js';
// import { seedStaff } from './seeds/staff.js';
// import { seedKenyaTennis } from './seeds/kenya-tennis-seed.js';
// import { seedDeveloperUser } from './seeds/seed-developer-user.js';

import { PrismaClient } from '../src/generated/prisma/index.js';
import {
  initializeSeedCheckpoints,
  shouldSkipSeed,
  startSeed,
  completeSeed,
  failSeed,
  printSeedStatusReport,
} from './seeds/seed-tracker.js';

const prisma = new PrismaClient();

// Helper to wrap seed functions with error handling and tracking
async function executeSeed<T>(
  seedName: string,
  seedFunction: () => Promise<T>,
): Promise<{ success: boolean; result?: T; error?: string }> {
  if (await shouldSkipSeed(prisma, seedName)) {
    console.log(`⏭️ Skipping ${seedName} (already completed)`);
    return { success: true };
  }

  await startSeed(prisma, seedName);

  try {
    console.log(`\n⏳ Starting ${seedName}...`);
    const result = await seedFunction();
    await completeSeed(prisma, seedName, Array.isArray(result) ? result.length : 0);
    console.log(`✅ ${seedName} completed successfully`);
    return { success: true, result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await failSeed(prisma, seedName, errorMessage);
    console.error(`❌ ${seedName} failed:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

async function main() {
  try {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🌱 TENNIS TRACKER DATABASE SEEDING');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋 With Checkpoint System - Only new/failed seeds will be applied');
    console.log('   Disabled seeds (large data): tournaments, matches, payments, stats,');
    console.log('   community, bookings, tournament-players, staff data, etc.');
    console.log('   👉 See imports at top of file to enable/disable seeds\n');

    await initializeSeedCheckpoints(prisma);

    // 1. Seed organizations first
    console.log('📍 STEP 1: Organizations');
    console.log('───────────────────────────────────────────────────────────────');
    const orgResult = await executeSeed('organizations', () => seedOrganizations());
    if (!orgResult.success) throw new Error('Organizations seed must succeed');
    const organizations = orgResult.result || [];

    // 2. Seed users (players, coaches, admins, etc.)
    console.log('\n📍 STEP 2: Users & Roles');
    console.log('───────────────────────────────────────────────────────────────');
    const usersResult = await executeSeed('users', () => seedUsers(organizations));
    const users = (usersResult.result || []) as any[];

    // 3. Create courts for each organization
    console.log('\n📍 STEP 3: Courts');
    console.log('───────────────────────────────────────────────────────────────');
    const courtsResult = await executeSeed('courts', () => seedCourts(organizations));
    const courts = courtsResult.result || [];

    // 4. Create membership tiers and add members to organizations
    console.log('\n📍 STEP 4: Memberships');
    console.log('───────────────────────────────────────────────────────────────');
    const membershipsResult = await executeSeed('memberships', () => seedMemberships(organizations, users));
    const { tiers = [], members = [] } = membershipsResult.result || {};

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✨ MINIMAL SEEDING SESSION COMPLETED!\n');
    console.log('📊 SUMMARY:');
    console.log(`  • Organizations: ${organizations.length}`);
    console.log(`  • Users: ${users.length}`);
    console.log(`  • Courts: ${courts.length}`);
    console.log(`  • Membership Tiers: ${tiers.length}`);
    console.log(`  • Club Members: ${members.length}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Print detailed seed status report
    printSeedStatusReport();

    console.log('✨ Minimal seed complete.');
    console.log('═══════════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n❌ Seeding session failed:', error);
    printSeedStatusReport();
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
