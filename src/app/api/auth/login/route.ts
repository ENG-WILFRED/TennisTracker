import { NextResponse } from 'next/server';
import { loginPlayer } from '@/actions/auth';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { PrismaClient } from '@/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { usernameOrEmail, password } = body;

    if (!usernameOrEmail || !password) {
      return NextResponse.json({ error: 'Username/email and password are required' }, { status: 400 });
    }

    // First try existing player login action
    try {
      const user = await loginPlayer({ usernameOrEmail, password });

      const accessToken = generateAccessToken({ playerId: user.id, email: user.email, username: user.username });
      const refreshToken = generateRefreshToken({ playerId: user.id, email: user.email, username: user.username });

      return NextResponse.json({ accessToken, refreshToken, user: { ...user, role: 'player' } });
    } catch (err) {
      // Not a player or failed login - try referee
    }

    // Try referee login
    const referee = await prisma.referee.findFirst({
      where: {
        OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      },
    });

    if (!referee) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, referee.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const accessToken = generateAccessToken({ playerId: referee.id, email: referee.email, username: referee.username });
    const refreshToken = generateRefreshToken({ playerId: referee.id, email: referee.email, username: referee.username });

    const clientUser = {
      id: referee.id,
      username: referee.username,
      email: referee.email,
      firstName: referee.firstName,
      lastName: referee.lastName,
      photo: referee.photo || null,
      role: 'referee',
    };

    return NextResponse.json({ accessToken, refreshToken, user: clientUser });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
}