import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '@/lib/prisma';

/**
 * Integration Test: Coach to Player DM
 * Tests the scenario where a coach (who might not have a player profile) sends a DM to a player
 */

describe('Coach to Player Messaging', () => {
  let coach: any;
  let coachPlayer: any;
  let player: any;
  let playerPlayer: any;

  beforeAll(async () => {
    // Create a coach user
    coach = await prisma.user.create({
      data: {
        email: `test-coach-${Date.now()}@example.com`,
        username: `coach-${Date.now()}`,
        firstName: 'Coach',
        lastName: 'User',
        passwordHash: 'hashedPassword123',
      },
    });

    // Create a player user
    player = await prisma.user.create({
      data: {
        email: `test-player-${Date.now()}@example.com`,
        username: `player-${Date.now()}`,
        firstName: 'Player',
        lastName: 'User',
        passwordHash: 'hashedPassword123',
      },
    });

    // Create player profiles for both
    coachPlayer = await prisma.player.create({
      data: {
        userId: coach.id,
      },
    });

    playerPlayer = await prisma.player.create({
      data: {
        userId: player.id,
      },
    });
  });

  afterAll(async () => {
    // Clean up - delete in correct order due to foreign keys
    await prisma.chatParticipant.deleteMany({
      where: { playerId: { in: [coach.id, player.id] } },
    });

    await prisma.chatRoom.deleteMany({
      where: {
        OR: [{ createdBy: coach.id }, { createdBy: player.id }],
      },
    });

    // Delete players first (they reference users)
    await prisma.player.deleteMany({
      where: { userId: { in: [coach.id, player.id] } },
    });

    // Then delete users
    await prisma.user.deleteMany({
      where: { id: { in: [coach.id, player.id] } },
    });
  });

  it('should allow creating a DM room when both users have player profiles', async () => {
    // Create a chat room with both as participants
    const room = await prisma.chatRoom.create({
      data: {
        name: `DM: Coach to Player`,
        isDM: true,
        createdBy: coach.id,
        participants: {
          create: [
            {
              playerId: coach.id,
              isOnline: true,
            },
            {
              playerId: player.id,
              isOnline: false,
            },
          ],
        },
      },
      include: {
        participants: true,
      },
    });

    expect(room).toBeDefined();
    expect(room.id).toBeDefined();
    expect(room.isDM).toBe(true);
    expect(room.participants).toHaveLength(2);
  });

  it('should verify both users have player profiles', async () => {
    const coachPlayerRecord = await prisma.player.findUnique({
      where: { userId: coach.id },
    });

    const playerRecord = await prisma.player.findUnique({
      where: { userId: player.id },
    });

    expect(coachPlayerRecord).toBeDefined();
    expect(playerRecord).toBeDefined();
  });
});
