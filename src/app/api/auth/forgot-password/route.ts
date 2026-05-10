import { NextResponse } from 'next/server';
import { requestPasswordResetOtp } from '@/actions/auth';
import { recordEndpointMetrics } from '@/lib/monitoring';

export async function POST(request: Request) {
  const start = Date.now();
  let status = 200;

  try {
    const body = await request.json();
    const { email } = body as { email?: string };

    if (!email || !email.trim()) {
      status = 400;
      return NextResponse.json({ error: 'Email is required.' }, { status });
    }

    await requestPasswordResetOtp(email);
    return NextResponse.json({ success: true, message: 'If this email exists, an OTP has been sent.' });
  } catch (error: any) {
    status = error?.status || 500;
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: error?.message || 'Unable to process password reset request.' }, { status });
  } finally {
    recordEndpointMetrics('/api/auth/forgot-password', 'POST', status, Date.now() - start);
  }
}
