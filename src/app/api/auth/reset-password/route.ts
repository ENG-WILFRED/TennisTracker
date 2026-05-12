import { NextResponse } from 'next/server';
import { resetPasswordWithOtp } from '@/actions/auth';
import { recordEndpointMetrics } from '@/lib/monitoring';

export async function POST(request: Request) {
  const start = Date.now();
  let status = 200;

  try {
    const body = await request.json();
    const { email, otp, newPassword } = body as { email?: string; otp?: string; newPassword?: string };

    if (!email || !otp || !newPassword) {
      status = 400;
      return NextResponse.json({ error: 'Email, OTP, and new password are required.' }, { status });
    }

    await resetPasswordWithOtp({ email, otp, newPassword });
    return NextResponse.json({ success: true, message: 'Password reset successfully.' });
  } catch (error: any) {
    status = error?.status || 400;
    console.error('Reset password error:', error);
    return NextResponse.json({ error: error?.message || 'Unable to reset password.' }, { status });
  } finally {
    recordEndpointMetrics('/api/auth/reset-password', 'POST', status, Date.now() - start);
  }
}
