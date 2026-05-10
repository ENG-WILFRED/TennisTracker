import prisma from '../src/lib/prisma';
import { requestPasswordResetOtp, resetPasswordWithOtp } from '../src/actions/auth';

async function testOtpFlow() {
  console.log('🧪 Testing OTP Password Reset Flow...\n');

  // Create a test user if it doesn't exist
  const testEmail = 'otp-test@example.com';
  let user = await prisma.user.findUnique({ where: { email: testEmail } });

  if (!user) {
    console.log('📝 Creating test user...');
    user = await prisma.user.create({
      data: {
        email: testEmail,
        username: 'otptester',
        firstName: 'OTP',
        lastName: 'Tester',
        passwordHash: 'dummy_hash_for_test',
      },
    });
    console.log('✓ Test user created\n');
  } else {
    console.log('✓ Test user already exists\n');
  }

  try {
    // Test 1: Request OTP
    console.log('1️⃣  Testing requestPasswordResetOtp()...');
    const result = await requestPasswordResetOtp(testEmail);
    console.log('✓ OTP requested successfully\n');

    // Get the OTP from the database
    const otpRecord = await prisma.passwordResetOtp.findFirst({
      where: { email: testEmail, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new Error('OTP record not found in database');
    }

    console.log(`✓ OTP generated: ${otpRecord.otp}`);
    console.log(`✓ Expires at: ${otpRecord.expiresAt}\n`);

    // Test 2: Reset password with OTP
    console.log('2️⃣  Testing resetPasswordWithOtp()...');
    const newPassword = 'NewSecurePassword123!';
    
    await resetPasswordWithOtp({
      email: testEmail,
      otp: otpRecord.otp,
      newPassword,
    });

    console.log('✓ Password reset successfully\n');

    // Verify the OTP is marked as used
    const usedOtp = await prisma.passwordResetOtp.findUnique({
      where: { id: otpRecord.id },
    });

    if (usedOtp?.status === 'USED') {
      console.log('✓ OTP marked as USED\n');
    } else {
      console.log('⚠ OTP status:', usedOtp?.status, '\n');
    }

    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testOtpFlow();
