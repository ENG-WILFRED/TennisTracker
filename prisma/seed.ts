// ═══════════════════════════════════════════════════════════════════════════════
// ENABLED SEEDS - These will run during seeding
// ═══════════════════════════════════════════════════════════════════════════════
import { seedOrganizations } from './seeds/organizations.js';
import { seedUsers } from './seeds/users.js';
import { seedCourts } from './seeds/courts.js';
import { seedMemberships } from './seeds/memberships.js';
import { seedEnhancedBookings } from './seeds/bookings-enhanced.js';
import { seedPaymentRecords } from './seeds/payments.js';
import { seedMatches } from './seeds/matches.js';
import { seedCommunity } from './seeds/community.js';
import { seedTournaments } from './seeds/tournaments.js';
import { seedStats } from './seeds/stats.js';
import { seedTournamentComments } from './seeds/tournament-comments.js';
import { seedStaffForAllOrgs } from './seeds/staff.js';
import { seedNewStaffSystem } from './seeds/staff-new-system.js';
import { seedStaffDashboardData } from './seeds/staff-dashboard-data.js';
import { seedTournamentTasks } from './seeds/tournament-tasks.js';
import { seedTaskTemplates } from './seeds/task-templates-complete.js';
import { seedTournamentPlayers } from './seeds/tournament-players-seeding.js';
import { seedKenyaPlayersAndCourts } from './seeds/kenya-tennis-seed.js';
import { seedCoachSessions } from './seeds/coach-sessions.js';
import { seedAdminDashboardData } from './seeds/admin-dashboard-data.js';
import { PrismaClient, User } from '../src/generated/prisma/index.js';
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

    // 5. Create enhanced bookings with realistic patterns
    console.log('\n📍 STEP 5: Enhanced Booking Data (Realistic Patterns)');
    console.log('───────────────────────────────────────────────────────────────');
    const bookingsResult = await executeSeed('enhanced-bookings', () =>
      seedEnhancedBookings(organizations, users, courts),
    );
    const enhancedBookings = bookingsResult.result || [];

    // 6. Create payment records
    console.log('\n📍 STEP 6: Payment Records');
    console.log('───────────────────────────────────────────────────────────────');
    const paymentsResult = await executeSeed('payments', () => seedPaymentRecords());
    const payments = paymentsResult.result || [];

    // 7. Create matches between players
    console.log('\n📍 STEP 7: Matches');
    console.log('───────────────────────────────────────────────────────────────');
    const referees = users.filter((u) => u.referee);
    const matchesResult = await executeSeed('matches', () => seedMatches(users, referees));
    const matches = matchesResult.result || [];

    // 8. Seed community (posts, comments, reactions, follows)
    console.log('\n📍 STEP 8: Community');
    console.log('───────────────────────────────────────────────────────────────');
    const communityResult = await executeSeed('community', () => seedCommunity(users));
    const { posts = [], comments = [], reactions = [], follows = [] } = communityResult.result || {};

    // 9. Seed tournaments
    console.log('\n📍 STEP 9: Tournaments');
    console.log('───────────────────────────────────────────────────────────────');
    await executeSeed('tournaments', () => seedTournaments());

    // 10. Seed tournament comments
    console.log('\n📍 STEP 10: Tournament Comments');
    console.log('───────────────────────────────────────────────────────────────');
    const tournamentCommentsResult = await executeSeed('tournament-comments', () =>
      seedTournamentComments(),
    );
    const tournamentComments = tournamentCommentsResult.result || 0;

    // 11. Seed player statistics and rankings
    console.log('\n📍 STEP 11: Player Statistics & Rankings');
    console.log('───────────────────────────────────────────────────────────────');
    await executeSeed('player-stats', () => seedStats());

    // 12. Seed staff members
    console.log('\n📍 STEP 12: Staff Members');
    console.log('───────────────────────────────────────────────────────────────');
    await executeSeed('staff', () => seedStaffForAllOrgs());

    // 12B. Seed new enterprise staff system with departments and roles
    console.log('\n📍 STEP 12B: New Enterprise Staff System');
    console.log('───────────────────────────────────────────────────────────────');
    await executeSeed('staff-new-system', () => seedNewStaffSystem());

    // 12C. Seed staff dashboard sample security logs and incidents
    console.log('\n📍 STEP 12C: Staff Dashboard Security Data');
    console.log('───────────────────────────────────────────────────────────────');
    await executeSeed('staff-dashboard-data', () => seedStaffDashboardData());

    // 12D. Seed admin dashboard operational data
    console.log('\n📍 STEP 12D: Admin Dashboard Operational Data');
    console.log('───────────────────────────────────────────────────────────────');
    await executeSeed('admin-dashboard-data', () => seedAdminDashboardData());

    // 13. Seed coach sessions and activity links
    console.log('\n📍 STEP 13: Coach Sessions');
    console.log('───────────────────────────────────────────────────────────────');
    await executeSeed('coach-sessions', () => seedCoachSessions());

    // 14. Seed task templates
    console.log('\n📍 STEP 14: Task Templates');
    console.log('───────────────────────────────────────────────────────────────');
    await executeSeed('task-templates', () => seedTaskTemplates());

    // 15. Seed tournament tasks
    console.log('\n📍 STEP 15: Tournament Tasks');
    console.log('───────────────────────────────────────────────────────────────');
    await executeSeed('tournament-tasks', () => seedTournamentTasks());

    // 16. Seed tournament players (may fail due to duplicates - will retry next run)
    console.log('\n📍 STEP 16: Tournament Players');
    console.log('───────────────────────────────────────────────────────────────');
    await executeSeed('tournament-players', () => seedTournamentPlayers());

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
