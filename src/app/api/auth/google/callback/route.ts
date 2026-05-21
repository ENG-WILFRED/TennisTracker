import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { handleGoogleAuth } from '@/actions/google-auth';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { isDeveloperEmail, getOtherDeveloperEmail, generateOtpCode } from '@/lib/developer';
import { sendOtpNotification, sendDeveloperLoginAlertEmail } from '@/app/api/notification/producer';

// Helper: fetch with timeout and retries to handle transient network issues
async function fetchWithTimeoutAndRetry(input: RequestInfo | URL, init?: RequestInit, timeout = 30000, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(input, { ...init, signal: controller.signal } as any);
      clearTimeout(id);
      return res;
    } catch (err: any) {
      clearTimeout(id);
      // If aborted due to timeout or network error, retry unless last attempt
      const isLast = attempt === retries;
      // Treat DOMException name 'AbortError' or Node fetch ETIMEDOUT as retryable
      if (isLast) throw err;
      // small backoff before retrying
      await new Promise((r) => setTimeout(r, 300 * Math.pow(2, attempt)));
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
    }

    // Exchange code for tokens using Google OAuth (with retries/timeouts)
    let tokenResponse;
    try {
      tokenResponse = await fetchWithTimeoutAndRetry(
        'https://oauth2.googleapis.com/token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID || '',
            client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
            redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/google/callback`,
            grant_type: 'authorization_code',
          }),
        },
        30000,
        3
      );
    } catch (err: any) {
      console.error('Failed to fetch tokens from Google after retries:', { error: err.message, code: err.code });
      return NextResponse.json({ error: 'Failed to reach Google OAuth service. Please try again in a moment.' }, { status: 503 });
    }

    if (!tokenResponse || !tokenResponse.ok) {
      console.error('Token exchange failed or no response from token endpoint');
      return NextResponse.json({ error: 'Failed to exchange code for tokens' }, { status: 400 });
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData?.access_token) {
      console.error('Google token response missing access_token', tokenData);
      return NextResponse.json({ error: 'Missing access token from Google' }, { status: 400 });
    }

    const decodeIdTokenPayload = (idToken: string) => {
      try {
        const payload = idToken.split('.')[1];
        const decoded = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
        return JSON.parse(decoded);
      } catch {
        return null;
      }
    };

    let googleUser: Record<string, any> | null = null;
    let lastUserInfoError: unknown = null;

    if (tokenData.id_token) {
      const idTokenUser = decodeIdTokenPayload(tokenData.id_token);
      if (idTokenUser?.email) {
        googleUser = idTokenUser;
      }
    }

    if (!googleUser) {
      const userInfoUrls = [
        'https://openidconnect.googleapis.com/v1/userinfo',
        'https://www.googleapis.com/oauth2/v3/userinfo',
        'https://www.googleapis.com/oauth2/v2/userinfo',
      ];

      for (const url of userInfoUrls) {
        try {
          const userInfoResponse = await fetchWithTimeoutAndRetry(url, {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
              Accept: 'application/json',
            },
          }, 25000, 2);

          if (!userInfoResponse || !userInfoResponse.ok) {
            lastUserInfoError = new Error(`Google userinfo request failed (${url}): ${userInfoResponse?.status}`);
            continue;
          }

          googleUser = await userInfoResponse.json();
          break;
        } catch (error) {
          lastUserInfoError = error;
        }
      }
    }

    if (!googleUser) {
      console.error('Google user info fetch failed', {
        error: lastUserInfoError,
        tokenData,
      });
      return NextResponse.json({ error: 'Failed to fetch user info' }, { status: 502 });
    }

    // Handle Google auth and auto-register if needed
    const result = await handleGoogleAuth({
      email: googleUser.email,
      firstName: googleUser.given_name,
      lastName: googleUser.family_name,
      image: googleUser.picture,
    });

    const user = result.user;
    const developerLogin = isDeveloperEmail(user.email) || Boolean((user as any).isDeveloper);

    if (developerLogin) {
      const otpCode = generateOtpCode(6);
      const otpSession = await prisma.passwordResetOtp.create({
        data: {
          userId: user.id,
          email: user.email,
          otp: otpCode,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      await sendOtpNotification(user.email, 'developer_login_otp', 'email', otpCode, user.firstName || 'Developer');
      const otherDeveloperEmail = getOtherDeveloperEmail(user.email);
      const ipAddress =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        request.headers.get('forwarded') ||
        'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      const loginTime = new Date().toISOString();
      const loginUserName = `${user.firstName || 'Developer'} ${user.lastName || ''}`.trim();
      if (otherDeveloperEmail) {
        await sendDeveloperLoginAlertEmail(
          otherDeveloperEmail,
          user.email,
          loginUserName,
          'google',
          loginTime,
          ipAddress,
          userAgent
        );
      }

      const redirectUrl = new URL('/login', process.env.NEXTAUTH_URL || 'http://localhost:3000');
      redirectUrl.searchParams.set('developerOtpRequired', 'true');
      redirectUrl.searchParams.set('otpSessionId', otpSession.id);
      redirectUrl.searchParams.set('email', user.email);
      redirectUrl.searchParams.set('firstName', user.firstName || 'Developer');
      redirectUrl.searchParams.set('lastName', user.lastName || 'User');
      if (user.photo) redirectUrl.searchParams.set('photo', user.photo);

      return NextResponse.redirect(redirectUrl);
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

    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // If new user, redirect to complete profile
    if (result.isNew) {
      // Store in session storage on client side
      const responseUrl = new URL('/auth/complete-google-profile', appUrl);
      responseUrl.searchParams.set('userId', user.id);
      responseUrl.searchParams.set('email', user.email);
      responseUrl.searchParams.set('username', user.username);
      if (user.photo) {
        responseUrl.searchParams.set('photo', user.photo);
      }
      responseUrl.searchParams.set('accessToken', accessToken);
      responseUrl.searchParams.set('refreshToken', refreshToken);
      responseUrl.searchParams.set('firstName', user.firstName);
      responseUrl.searchParams.set('lastName', user.lastName);

      return NextResponse.redirect(responseUrl);
    }

    // Existing user - redirect to OAuth role selection flow
    const responseUrl = new URL('/auth/oauth-role-select', appUrl);
    responseUrl.searchParams.set('userId', user.id);
    responseUrl.searchParams.set('email', user.email);
    responseUrl.searchParams.set('username', user.username || '');
    if (user.photo) responseUrl.searchParams.set('photo', user.photo);
    responseUrl.searchParams.set('firstName', user.firstName || '');
    responseUrl.searchParams.set('lastName', user.lastName || '');
    responseUrl.searchParams.set('accessToken', accessToken);
    responseUrl.searchParams.set('refreshToken', refreshToken);

    const response = NextResponse.redirect(responseUrl);

    // Still set cookies for server-side routes
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
    });
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Authentication failed';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
