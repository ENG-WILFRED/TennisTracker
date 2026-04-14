import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function registerUser(user: any) {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  return res.json();
}

async function loginUser({ usernameOrEmail, password }: { usernameOrEmail: string; password: string }) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail, password }),
  });
  return res.json();
}

describe('Auth Flow', () => {
  const testUser = {
    username: 'testuser_' + Math.random().toString(36).substring(2, 8),
    email: 'testuser_' + Math.random().toString(36).substring(2, 8) + '@example.com',
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'User',
    acceptedTerms: true,
  };

  it('should register a new user', async () => {
    const res = await registerUser(testUser);
    expect(res.success).toBe(true);
  });

  it('should not allow duplicate registration', async () => {
    const res = await registerUser(testUser);
    expect(res.error).toBeDefined();
  });

  it('should login with correct credentials', async () => {
    const res = await loginUser({ usernameOrEmail: testUser.username, password: testUser.password });
    expect(res.accessToken).toBeDefined();
    expect(res.user).toBeDefined();
    expect(res.user.email).toBe(testUser.email);
  });

  it('should fail login with wrong password', async () => {
    const res = await loginUser({ usernameOrEmail: testUser.username, password: 'WrongPass123!' });
    expect(res.error).toBeDefined();
  });
});
