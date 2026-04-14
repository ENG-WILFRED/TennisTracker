import { blacklistAccessToken, blacklistRefreshToken } from '@/lib/tokenBlacklist';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as any));
    const refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken : null;
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (refreshToken) {
      blacklistRefreshToken(refreshToken);
    }

    if (accessToken) {
      blacklistAccessToken(accessToken);
    }

    return new Response(
      JSON.stringify({ message: 'Logged out successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Logout error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Logout failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
