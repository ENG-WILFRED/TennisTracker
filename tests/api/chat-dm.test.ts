import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '@/lib/prisma';
import { generateAccessToken } from '@/lib/jwt';
import { POST } from '@/app/api/chat/dm/route';

/**
 * Chat DM API Tests
 * Tests the /api/chat/dm endpoint
 */

describe('Chat DM API', () => {
  let testUser1: any;
  let testUser2: any;
  let testPlayer1: any;
  let testPlayer2: any;

  beforeAll(async () => {
    // Create test users
    testUser1 = await prisma.user.create({
      data: {
        email: `test-chat-user-1-${Date.now()}@example.com`,
        username: `testuser1-${Date.now()}`,
        firstName: 'Test',
        lastName: 'User 1',
        passwordHash: 'hashedPassword123',
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        email: `test-chat-user-2-${Date.now()}@example.com`,
        username: `testuser2-${Date.now()}`,
        firstName: 'Test',
        lastName: 'User 2',
        passwordHash: 'hashedPassword123',
      },
    });

    // Create test players for both users
    testPlayer1 = await prisma.player.create({
      data: {
        userId: testUser1.id,
      },
    });

    testPlayer2 = await prisma.player.create({
      data: {
        userId: testUser2.id,
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testPlayer1?.userId) {
      await prisma.chatParticipant.deleteMany({
        where: { playerId: testPlayer1.userId },
      });
    }

    if (testPlayer2?.userId) {
      await prisma.chatParticipant.deleteMany({
        where: { playerId: testPlayer2.userId },
      });
    }

    await prisma.chatRoom.deleteMany({
      where: {
        OR: [
          { createdBy: testUser1.id },
          { createdBy: testUser2.id },
        ],
      },
    });

    if (testUser1?.id) {
      await prisma.user.delete({
        where: { id: testUser1.id },
      }).catch(() => {}); // Ignore if already deleted
    }

    if (testUser2?.id) {
      await prisma.user.delete({
        where: { id: testUser2.id },
      }).catch(() => {}); // Ignore if already deleted
    }
  });

  it('should verify player records exist for both test users', async () => {
    const player1 = await prisma.player.findUnique({
      where: { userId: testUser1.id },
      include: { user: true },
    });

    const player2 = await prisma.player.findUnique({
      where: { userId: testUser2.id },
      include: { user: true },
    });

    expect(player1).toBeDefined();
    expect(player1?.userId).toBe(testUser1.id);
    expect(player1?.user?.email).toBe(testUser1.email);
    
    expect(player2).toBeDefined();
    expect(player2?.userId).toBe(testUser2.id);
    expect(player2?.user?.email).toBe(testUser2.email);
  });

  it('should allow creating chat participants with valid playerId references', async () => {
    // Create a test room first
    const testRoom = await prisma.chatRoom.create({
      data: {
        name: 'Test DM Room',
        isDM: true,
        createdBy: testUser1.id,
      },
    });

    // Now create participants - this should not fail with foreign key constraint
    const participant1 = await prisma.chatParticipant.create({
      data: {
        roomId: testRoom.id,
        playerId: testPlayer1.userId, // userId is the correct reference for Player.userId
        isOnline: true,
      },
    });

    const participant2 = await prisma.chatParticipant.create({
      data: {
        roomId: testRoom.id,
        playerId: testPlayer2.userId,
        isOnline: false,
      },
    });

    expect(participant1).toBeDefined();
    expect(participant1.roomId).toBe(testRoom.id);
    expect(participant1.playerId).toBe(testPlayer1.userId);

    expect(participant2).toBeDefined();
    expect(participant2.roomId).toBe(testRoom.id);
    expect(participant2.playerId).toBe(testPlayer2.userId);

    // Cleanup
    await prisma.chatParticipant.deleteMany({
      where: { roomId: testRoom.id },
    });
    await prisma.chatRoom.delete({
      where: { id: testRoom.id },
    });
  });

  it('should create missing player profiles when authenticated user has no profile', async () => {
    // Create a requesting user without a player profile
    const requestingUser = await prisma.user.create({
      data: {
        email: `test-chat-missing-profile-${Date.now()}@example.com`,
        username: `testmissingprofile-${Date.now()}`,
        firstName: 'Requesting',
        lastName: 'User',
        passwordHash: 'hashedPassword123',
      },
    });

    const targetUser = await prisma.user.create({
      data: {
        email: `test-chat-target-${Date.now()}@example.com`,
        username: `testtarget-${Date.now()}`,
        firstName: 'Target',
        lastName: 'User',
        passwordHash: 'hashedPassword123',
      },
    });

    const targetPlayer = await prisma.player.create({
      data: {
        userId: targetUser.id,
      },
    });

    const token = generateAccessToken({
      playerId: requestingUser.id,
      email: requestingUser.email,
      username: requestingUser.username,
    });

    const res = await POST(new Request('http://localhost/api/chat/dm', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetUserId: targetUser.id }),
    }));

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toMatchObject({ isDM: true, id: expect.any(String) });

    const requestingUserPlayer = await prisma.player.findUnique({
      where: { userId: requestingUser.id },
    });

    expect(requestingUserPlayer).toBeDefined();

    await prisma.chatParticipant.deleteMany({
      where: { playerId: { in: [requestingUser.id, targetUser.id] } },
    });
    await prisma.chatRoom.deleteMany({
      where: { createdBy: requestingUser.id },
    });
    await prisma.player.delete({ where: { userId: requestingUser.id } });
    await prisma.player.delete({ where: { userId: targetUser.id } });
    await prisma.user.delete({ where: { id: requestingUser.id } });
    await prisma.user.delete({ where: { id: targetUser.id } });
  });

  it('should validate that users have player profiles before creating DM', async () => {
    // Create a user without a player profile
    const userWithoutPlayer = await prisma.user.create({
      data: {
        email: `test-chat-no-player-${Date.now()}@example.com`,
        username: `testnoaplayer-${Date.now()}`,
        firstName: 'No',
        lastName: 'Player',
        passwordHash: 'hashedPassword123',
      },
    });

    // Try to find player - should return null
    const playerRecord = await prisma.player.findUnique({
      where: { userId: userWithoutPlayer.id },
    });

    expect(playerRecord).toBeNull();

    // Cleanup
    await prisma.user.delete({
      where: { id: userWithoutPlayer.id },
    });
  });
});
