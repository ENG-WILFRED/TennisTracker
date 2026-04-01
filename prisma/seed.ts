import { seedOrganizations } from './seeds/organizations.js';
import { seedUsers } from './seeds/users.js';
import { seedCourts } from './seeds/courts.js';
import { seedMemberships } from './seeds/memberships.js';
import { seedMatches } from './seeds/matches.js';
import { seedBookings } from './seeds/bookings.js';
import { seedEnhancedBookings } from './seeds/bookings-enhanced.js';
import { seedPaymentRecords } from './seeds/payments.js';
import { seedCommunity } from './seeds/community.js';
import { seedTournaments } from './seeds/tournaments.js';
import { seedStats } from './seeds/stats.js';
import { seedTournamentComments } from './seeds/tournament-comments.js';
import { seedStaffForAllOrgs } from './seeds/staff.js';

async function main() {
  try {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🌱 TENNIS TRACKER DATABASE SEEDING');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // 1. Seed organizations first
    console.log('📍 STEP 1: Organizations');
    console.log('───────────────────────────────────────────────────────────────');
    const organizations = await seedOrganizations();

    // 2. Seed users (players, coaches, admins, etc.)
    console.log('📍 STEP 2: Users & Roles');
    console.log('───────────────────────────────────────────────────────────────');
    const users = await seedUsers(organizations);

    // 3. Create courts for each organization
    console.log('📍 STEP 3: Courts');
    console.log('───────────────────────────────────────────────────────────────');
    const courts = await seedCourts(organizations);

    // 4. Create membership tiers and add members to organizations
    console.log('📍 STEP 4: Memberships');
    console.log('───────────────────────────────────────────────────────────────');
    const { tiers, members } = await seedMemberships(organizations, users);

    // 5. Create court bookings for testing
    console.log('📍 STEP 5: Court Bookings');
    console.log('───────────────────────────────────────────────────────────────');
    const bookings = await seedBookings(organizations, users, courts);

    // 5B. Create enhanced bookings with realistic patterns
    console.log('📍 STEP 5B: Enhanced Booking Data (Realistic Patterns)');
    console.log('───────────────────────────────────────────────────────────────');
    const enhancedBookings = await seedEnhancedBookings(organizations, users, courts);

    // 5C. Create payment records
    console.log('📍 STEP 5C: Payment Records');
    console.log('───────────────────────────────────────────────────────────────');
    const payments = await seedPaymentRecords();

    // 6. Create matches between players
    console.log('📍 STEP 6: Matches');
    console.log('───────────────────────────────────────────────────────────────');
    const referees = users.filter((u) => u.referee);
    const matches = await seedMatches(users, referees);

    // 7. Seed community (posts, comments, reactions, follows)
    console.log('📍 STEP 7: Community');
    console.log('───────────────────────────────────────────────────────────────');
    const { posts, comments, reactions, follows } = await seedCommunity(users);

    // 8. Seed tournaments
    console.log('📍 STEP 8: Tournaments');
    console.log('───────────────────────────────────────────────────────────────');
    await seedTournaments();

    // 9. Seed tournament comments
    console.log('📍 STEP 9: Tournament Comments');
    console.log('───────────────────────────────────────────────────────────────');
    const tournamentComments = await seedTournamentComments();

    // 10. Seed player statistics and rankings
    console.log('📍 STEP 10: Player Statistics & Rankings');
    console.log('───────────────────────────────────────────────────────────────');
    await seedStats();

    // 11. Seed staff members
    console.log('📍 STEP 11: Staff Members');
    console.log('───────────────────────────────────────────────────────────────');
    await seedStaffForAllOrgs();

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✨ SEEDING COMPLETED SUCCESSFULLY!\n');
    console.log('📊 SUMMARY:');
    console.log(`  • Organizations: ${organizations.length}`);
    console.log(`  • Users: ${users.length}`);
    console.log(`  • Courts: ${courts.length}`);
    console.log(`  • Membership Tiers: ${tiers.length}`);
    console.log(`  • Club Members: ${members.length}`);
    console.log(`  • Court Bookings (Basic): ${bookings.length}`);
    console.log(`  • Court Bookings (Enhanced): ${enhancedBookings.length}`);
    console.log(`  • Payment Records: ${payments.length}`);
    console.log(`  • Matches: ${matches.length}`);
    console.log(`  • Community Posts: ${posts.length}`);
    console.log(`  • Comments: ${comments.length}`);
    console.log(`  • Reactions: ${reactions.length}`);
    console.log(`  • User Follows: ${follows.length}`);
    console.log(`  • Tournaments: 5 (1 completed, 1 in progress, 1 ongoing, 2 upcoming)`);
    console.log(`  • Tournament Comments: ${tournamentComments}`);
    console.log(`  • Player Rankings: Created for ${members.length} players (current + historical)`);
    console.log(`  • Staff Members: Created across all organizations`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('🔐 TEST ACCOUNT CREDENTIALS (password: tennis123):');
    console.log('───────────────────────────────────────────────────────────────');
    console.log('  🎾 Player (Independent):    marcus.johnson@example.com');
    console.log('  🎾 Player (Organization):   sophia.chen@example.com');
    console.log('  👨‍🏫 Coach:                    robert.coach@example.com');
    console.log('  ⚙️  Admin:                    admin@centraltennis.com');
    console.log('  💰 Finance Officer:         finance@centraltennis.com');
    console.log('  🏆 Referee:                 john.referee@example.com');
    console.log('  👁️  Spectator:              alice.spectator@example.com');
    console.log('═══════════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
