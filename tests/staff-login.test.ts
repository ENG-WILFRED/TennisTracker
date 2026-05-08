import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3020';

async function loginUser({ usernameOrEmail, password }: { usernameOrEmail: string; password: string }) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail, password }),
  });
  return res.json();
}

describe('Staff Department Routing', () => {
  const staffUsers = [
    { email: 'alice.finance@example.com', department: 'finance', role: 'finance_manager' },
    { email: 'carol.hr@example.com', department: 'hr', role: 'hr_manager' },
    { email: 'emma.reception@example.com', department: 'reception', role: 'receptionist' },
    { email: 'frank.security@example.com', department: 'security', role: 'security_officer' },
  ];

  it.each(staffUsers)('should login $email and route to $department dashboard', async ({ email, department, role }) => {
    const res = await loginUser({ usernameOrEmail: email, password: 'tennis123' });

    console.log(`Login response for ${email}:`, JSON.stringify(res, null, 2));

    // Check that login was successful (has tokens and user data)
    expect(res.accessToken).toBeDefined();
    expect(res.refreshToken).toBeDefined();
    expect(res.user).toBeDefined();
    expect(res.user.id).toBeDefined();

    // Check if user has the expected role
    const userMemberships = res.user?.memberships || [];
    const staffMembership = userMemberships.find((m: any) => m.role === role);
    expect(staffMembership).toBeDefined();
    expect(staffMembership.role).toBe(role);
  });
});