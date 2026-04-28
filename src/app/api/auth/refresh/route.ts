import { verifyToken, generateAccessToken, TokenPayload } from '@/lib/jwt';
import { isRefreshTokenBlacklisted } from '@/lib/tokenBlacklist';

export async function POST(request: Request) {
  try {
    // Check if request has a body
    const contentLength = request.headers.get('content-length');
    if (!contentLength || contentLength === '0') {
      return new Response(
        JSON.stringify({ error: 'Refresh token is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { refreshToken } = body as any;

    if (!refreshToken) {
      return new Response(
        JSON.stringify({ error: 'Refresh token is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify the refresh token
    const payload = verifyToken(refreshToken) as TokenPayload | null;

    if (!payload) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired refresh token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if refresh token is blacklisted (async)
    const isBlacklisted = await isRefreshTokenBlacklisted(refreshToken);
    if (isBlacklisted) {
      return new Response(
        JSON.stringify({ error: 'Refresh token has been revoked' }),
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
        refreshToken: refreshToken,
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
