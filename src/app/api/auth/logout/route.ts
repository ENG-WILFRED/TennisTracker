import { blacklistAccessToken, blacklistRefreshToken } from '@/lib/tokenBlacklist';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as any));
    const refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken : null;
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    // Blacklist tokens in parallel
    const promises: Promise<void>[] = [];

    if (refreshToken) {
      promises.push(blacklistRefreshToken(refreshToken));
    }

    if (accessToken) {
      promises.push(blacklistAccessToken(accessToken));
    }

    // Wait for all blacklist operations to complete
    if (promises.length > 0) {
      await Promise.all(promises);
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
