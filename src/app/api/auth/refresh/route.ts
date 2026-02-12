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
