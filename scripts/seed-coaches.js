/**
 * Seed script for Coach data - Links existing coaches to existing players
 * Run with: node scripts/seed-coaches.js
 */

import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function seedCoaches() {
  console.log('🌱 Starting coach-player relationship seed...');

  try {
    // 1. Get all existing coaches (Staff members with Coach role)
    const coaches = await prisma.staff.findMany({
      where: { role: { contains: 'Coach' } },
      include: { user: true },
    });

    if (coaches.length === 0) {
      console.log('❌ No coaches found. Create staff members with "Coach" role first.');
      return;
    }

    console.log(`✓ Found ${coaches.length} coaches`);

    // 2. Get all existing players
    const players = await prisma.player.findMany({
      include: { user: true },
    });

    if (players.length === 0) {
      console.log('❌ No players found in database.');
      return;
    }

    console.log(`✓ Found ${players.length} players`);

    // 3. Connect coaches to players
    let relationshipsCreated = 0;
    let notesCreated = 0;

    for (const coach of coaches) {
      // Assign 5 random players to each coach
      const playersForCoach = players
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(5, players.length));

      console.log(`\n👨‍🏫 Coach: ${coach.user.firstName} ${coach.user.lastName}`);

      for (const player of playersForCoach) {
        const relationship = await prisma.coachPlayerRelationship.upsert({
          where: {
            coachId_playerId: {
              coachId: coach.userId,
              playerId: player.userId,
            },
          },
          update: {
            status: 'active',
            sessionsCount: Math.floor(Math.random() * 20) + 1,
            lastSessionAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          },
          create: {
            coachId: coach.userId,
            playerId: player.userId,
            status: 'active',
            sessionsCount: Math.floor(Math.random() * 20) + 1,
            lastSessionAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          },
        });

        // Add coaching notes
        await prisma.coachPlayerNote.upsert({
          where: { id: relationship.id + '_note' },
          update: {},
          create: {
            relationshipId: relationship.id,
            title: 'Progress Update',
            content: 'Good progress. Keep working on footwork and serve technique.',
            category: 'progress',
          },
        }).catch(() => {
          // Ignore duplicate note errors
        });

        relationshipsCreated++;
        console.log(`  ✅ ${player.user.firstName} ${player.user.lastName} (${relationship.sessionsCount} sessions)`);
      }
    }

    console.log(`\n✅ Coach-player relationship seed completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Coaches: ${coaches.length}`);
    console.log(`   - Players: ${players.length}`);
    console.log(`   - Relationships Created: ${relationshipsCreated}`);
  } catch (error) {
    console.error('❌ Error seeding coach data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedCoaches();
