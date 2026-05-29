import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { UserRole } from '@/config/roles';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { otpSessionId, otp } = body as { otpSessionId?: string; otp?: string };

    if (!otpSessionId || !otp) {
      return NextResponse.json({ error: 'One-time code and session are required' }, { status: 400 });
    }

    const session = await prisma.passwordResetOtp.findUnique({
      where: { id: otpSessionId },
      include: { user: true },
    });

    if (!session || session.status !== 'PENDING' || !session.user) {
      return NextResponse.json({ error: 'Invalid or expired authentication session' }, { status: 401 });
    }

    if (session.expiresAt < new Date()) {
      await prisma.passwordResetOtp.update({
        where: { id: otpSessionId },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json({ error: 'Authentication code has expired' }, { status: 401 });
    }

    if (!session.user.isDeveloper) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const providedCode = String(otp).trim().toUpperCase();
    if (session.otp !== providedCode) {
      const nextAttempt = session.attemptCount + 1;
      await prisma.passwordResetOtp.update({
        where: { id: otpSessionId },
        data: {
          attemptCount: nextAttempt,
          status: nextAttempt >= 5 ? 'FAILED' : 'PENDING',
        },
      });

      return NextResponse.json({ error: 'Invalid authentication code' }, { status: 401 });
    }

    await prisma.passwordResetOtp.update({
      where: { id: otpSessionId },
      data: {
        status: 'USED',
        usedAt: new Date(),
      },
    });

    const user = session.user;
    const accessToken = generateAccessToken({ playerId: user.id, email: user.email, username: user.username });
    const refreshToken = generateRefreshToken({ playerId: user.id, email: user.email, username: user.username });

    const userPayload = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      photo: user.photo || null,
      profileComplete: user.profileComplete ?? true,
    };

    const availableMemberships = [
      {
        role: 'developer' as UserRole,
        orgId: '',
        orgName: 'Developer Console',
        status: 'accepted',
      },
    ];

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: userPayload,
      memberships: availableMemberships,
      availableRoles: availableMemberships,
    });
  } catch (error: any) {
    console.error('Developer OTP verification error:', error);
    return NextResponse.json({ error: error?.message || 'OTP verification failed' }, { status: 500 });
  }
}
