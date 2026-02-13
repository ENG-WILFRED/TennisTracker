import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'please-set-a-secure-secret';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

    try {
      const payload: any = jwt.verify(refreshToken, JWT_SECRET);
      const { id, role } = payload;

      // issue new tokens
      const accessToken = jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '15m' });
      const newRefresh = jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '7d' });

      return NextResponse.json({ accessToken, refreshToken: newRefresh });
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Refresh token error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
import { verifyToken, generateAccessToken, TokenPayload } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return new Response(
        JSON.stringify({ error: 'Refresh token is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify the refresh token
    const payload = verifyToken(refreshToken);

    if (!payload) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired refresh token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      playerId: payload.playerId,
      email: payload.email,
      username: payload.username,
    });

    return new Response(
      JSON.stringify({
        accessToken: newAccessToken,
        refreshToken: refreshToken, // Return the same refresh token
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Token refresh error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Token refresh failed' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
