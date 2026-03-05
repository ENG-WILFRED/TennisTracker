import { NextResponse } from 'next/server';
import { loginPlayer } from '@/actions/auth';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { PrismaClient } from '@/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { usernameOrEmail, password } = body as any;

    if (!usernameOrEmail || !password) {
      return NextResponse.json({ error: 'Username/email and password are required' }, { status: 400 });
    }

    // First try existing player login action
    try {
      const user = await loginPlayer({ usernameOrEmail, password });

      // Determine if this player is an organization owner
      const org = await prisma.organization.findFirst({ where: { createdBy: user.id } });

      const accessToken = generateAccessToken({ playerId: user.id, email: user.email, username: user.username });
      const refreshToken = generateRefreshToken({ playerId: user.id, email: user.email, username: user.username });

      const role = org ? 'org' : 'player';
      const clientUser: any = { ...user, role };
      if (org) clientUser.organizationId = org.id;

      return NextResponse.json({ accessToken, refreshToken, user: clientUser });
    } catch (err) {
      // Not a player or failed login - try referee
    }

    // Try referee login
    const referee = await prisma.referee.findFirst({
      where: {
        OR: [
          { user: { username: usernameOrEmail } },
          { user: { email: usernameOrEmail } },
        ],
      },
      include: { user: true },
    });

    if (!referee || !referee.user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, referee.user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const accessToken = generateAccessToken({ playerId: referee.user.id, email: referee.user.email, username: referee.user.username });
    const refreshToken = generateRefreshToken({ playerId: referee.user.id, email: referee.user.email, username: referee.user.username });

    const clientUser = {
      id: referee.user.id,
      username: referee.user.username,
      email: referee.user.email,
      firstName: referee.user.firstName,
      lastName: referee.user.lastName,
      photo: referee.user.photo || null,
      role: 'referee',
    };

    return NextResponse.json({ accessToken, refreshToken, user: clientUser });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
}