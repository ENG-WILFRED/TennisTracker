import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAccessToken } from '@/lib/jwt';
import { GET, POST } from '@/app/api/players/[playerId]/comments/route';
import { Request } from 'node-fetch';

describe('Player comments API', () => {
  let user: any;
  let player: any;

  beforeAll(async () => {
    user = await prisma.user.create({
      data: {
        email: `test-comment-user-${Date.now()}@example.com`,
        username: `testcommentuser-${Date.now()}`,
        firstName: 'Comment',
        lastName: 'Tester',
        passwordHash: 'testhash',
      },
    });

    player = await prisma.player.create({
      data: {
        userId: user.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.playerComment.deleteMany({
      where: {
        playerId: player.userId,
        authorId: user.id,
      },
    });

    await prisma.player.delete({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  it('should create a comment with rating and return 201', async () => {
    const token = generateAccessToken({
      playerId: user.id,
      email: user.email,
      username: user.username,
    });

    const payload = {
      text: 'This is a test comment',
      rating: 4,
    };

    const request = new Request(`http://localhost/api/players/${player.userId}/comments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const response = await POST(request as unknown as NextRequest, { params: Promise.resolve({ playerId: player.userId }) });
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.comment).toBeDefined();
    expect(body.comment.text).toBe(payload.text);
    expect(body.comment.rating).toBe(payload.rating);
    expect(body.comment.authorId).toBe(user.id);
  });

  it('should return comments including rating on GET', async () => {
    const request = new Request(`http://localhost/api/players/${player.userId}/comments`, {
      method: 'GET',
    });

    const response = await GET(request as unknown as NextRequest, { params: Promise.resolve({ playerId: player.userId }) });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.comments)).toBe(true);
    expect(body.comments.some((comment: any) => comment.rating === 4 && comment.text === 'This is a test comment')).toBe(true);
  });
});
