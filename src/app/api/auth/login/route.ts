import { loginPlayer } from '@/actions/auth';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { usernameOrEmail, password } = body;

    if (!usernameOrEmail || !password) {
      return new Response(
        JSON.stringify({ error: 'Username/email and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call the existing login action
    const user = await loginPlayer({ usernameOrEmail, password });

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      playerId: user.id,
      email: user.email,
      username: user.username,
    });

    const refreshToken = generateRefreshToken({
      playerId: user.id,
      email: user.email,
      username: user.username,
    });

    return new Response(
      JSON.stringify({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          photo: (user as any).photo || null,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Login failed' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
