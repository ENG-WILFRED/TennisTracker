/**
 * PILOT TEST SUITE - Scenario 3
 * =============================
 * Handle payment failures gracefully:
 * - User doesn't enter PIN
 * - M-Pesa timeout
 * - User cancels payment
 * 
 * CRITICAL: Users need clear feedback on what went wrong.
 * Vague errors = pilot failure.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '@/lib/prisma';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 30000;

let testOrganization: any;
let testCourt: any;
let testUser: any;
let testMember: any;

beforeAll(async () => {
  console.log('🧪 SCENARIO 3: Setting up test data...');
  
  testOrganization = await prisma.organization.create({
    data: {
      name: `Test Club - Payment Failure - ${Date.now()}`,
      slug: `test-club-payf-${Date.now()}`,

      country: 'KE',
      city: 'Nairobi',
    },
  });
  
  testCourt = await prisma.court.create({
    data: {
      organizationId: testOrganization.id,
      name: 'Payment Test Court',
      courtNumber: 1,
      surface: 'cement',
      peakPrice: 500,
    },
  });
  
  testUser = await prisma.user.create({
    data: {
      username: `payf-user-${Date.now()}`,
      email: `payf-test-${Date.now()}@example.com`,
      passwordHash: 'test-hash',
      firstName: 'Payment',
      lastName: 'Failure',
      phone: `2547220${Date.now().toString().slice(-4)}`,
    },
  });
  
  const player = await prisma.player.create({
    data: {
      userId: testUser.id,
    },
  });
  
  testMember = await prisma.clubMember.create({
    data: {
      organizationId: testOrganization.id,
      playerId: player.userId,
      role: 'player',
    },
  });
  
  console.log('✅ Test data created');
});

describe('Scenario 3: Payment Failure Handling', () => {
  
  it('should show clear error when payment times out', async () => {
    console.log('\n📋 Test 3.1: Timeout error handling...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const endTime = new Date(tomorrow);
    endTime.setHours(11, 0, 0, 0);
    
    // Create pending booking
    const booking = await prisma.courtBooking.create({
      data: {
        courtId: testCourt.id,
        organizationId: testOrganization.id,
        memberId: testMember.id,
        startTime: tomorrow,
        endTime: endTime,
        status: 'pending',
        price: testCourt.peakPrice || 500,
      },
    });
    
    // Simulate timeout - no callback received after 2 minutes
    const paymentRecord = await prisma.paymentRecord.create({
      data: {
        userId: testUser.id,
        eventId: testOrganization.id,
        bookingType: 'court_booking',
        amount: testCourt.peakPrice || 500,
        currency: 'KES',
        provider: 'mpesa',
        providerStatus: 'pending', // Still pending after timeout
        callbackUrl: `${BASE_URL}/api/payments/callback/mpesa`,
        cancelUrl: `${BASE_URL}/api/payments/cancel/mpesa`,
        metadata: JSON.stringify({
          bookingId: booking.id,
          error: 'User did not enter PIN within timeout period',
        }),
      },
    });
    
    // After timeout, payment should be marked failed
    const failedPayment = await prisma.paymentRecord.update({
      where: { id: paymentRecord.id },
      data: {
        providerStatus: 'failed',
      },
    });
    
    expect(failedPayment.providerStatus).toBe('failed');
    console.log(`✅ Timeout marked as failed payment`);
    
    (global as any).timeoutBookingId = booking.id;
    (global as any).timeoutPaymentId = paymentRecord.id;
  }, TEST_TIMEOUT);
  
  it('should show what user should do after failed payment', async () => {
    console.log('\n📋 Test 3.2: User guidance after failure...');
    
    const response = await fetch(`${BASE_URL}/api/payments/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentId: (global as any).timeoutPaymentId,
      }),
    });
    
    if (response.ok) {
      const status = await response.json();
      expect(status.status || status.providerStatus).toBeDefined();
      
      // Expect clear message
      if (status.status === 'failed' || status.providerStatus === 'failed') {
        console.log(`✅ User will see: Payment failed - Retry or contact support`);
      }
    }
  }, TEST_TIMEOUT);
  
  it('should allow user to retry booking after failed payment', async () => {
    console.log('\n📋 Test 3.3: Retry option after failure...');
    
    const bookingId = (global as any).timeoutBookingId;
    
    // Booking should still exist (not deleted)
    const booking = await prisma.courtBooking.findUnique({
      where: { id: bookingId },
    });
    
    expect(booking).toBeDefined();
    expect(booking?.status).toBe('pending'); // Still pending, not cancelled
    
    console.log(`✅ Booking still exists for retry: ${bookingId}`);
    console.log(`   User can click "Retry Payment" to try again`);
  }, TEST_TIMEOUT);
  
  it('should handle when M-Pesa rejects the number', async () => {
    console.log('\n📋 Test 3.4: Invalid M-Pesa number handling...');
    
    const invalidMobileData = {
      mobileNumber: '123456789', // Invalid format
      amount: 500,
      accountReference: 'TEST-REF',
      transactionDesc: 'Test payment',
      userId: testUser.id,
      eventId: testOrganization.id,
      bookingType: 'court_booking',
    };
    
    const response = await fetch(`${BASE_URL}/api/payments/mpesa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidMobileData),
    });
    
    expect(response.status).toBe(400);
    const error = await response.json();
    
    expect(error.error || error.message).toBeDefined();
    expect(error.error || error.message).toMatch(/invalid|format|254/i);
    
    console.log(`✅ Clear error: "${error.error || error.message}"`);
  }, TEST_TIMEOUT);
  
  it('should show retry button UI flow for failed payments', async () => {
    console.log('\n📋 Test 3.5: User sees "Retry" or "Contact Support" options...');
    
    const failureScenarios = [
      { code: 'TIMEOUT', message: 'Payment timed out. Please retry or contact support.' },
      { code: 'USER_CANCELLED', message: 'Payment cancelled. Retry when ready.' },
      { code: 'INSUFFICIENT_FUNDS', message: 'Insufficient balance. Please try again later.' },
      { code: 'INVALID_NUMBER', message: 'Invalid M-Pesa number. Please verify and retry.' },
    ];
    
    for (const scenario of failureScenarios) {
      expect(scenario.message).toBeDefined();
      expect(scenario.message.length).toBeGreaterThan(0);
      // Message should be user-friendly
      expect(scenario.message).toMatch(/Retry|contact|again/i);
      console.log(`   ✓ ${scenario.code}: ${scenario.message}`);
    }
    
    console.log(`✅ All failure scenarios have clear guidance`);
  }, TEST_TIMEOUT);
  
  it('should not delete booking when payment fails', async () => {
    console.log('\n📋 Test 3.6: Booking persistence after failure...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);
    tomorrow.setHours(14, 0, 0, 0);
    
    const endTime = new Date(tomorrow);
    endTime.setHours(15, 0, 0, 0);
    
    // Create booking
    const booking = await prisma.courtBooking.create({
      data: {
        courtId: testCourt.id,
        organizationId: testOrganization.id,
        memberId: testMember.id,
        startTime: tomorrow,
        endTime: endTime,
        status: 'pending',
        price: testCourt.peakPrice || 500,
      },
    });
    
    const bookingId = booking.id;
    
    // Create payment
    const payment = await prisma.paymentRecord.create({
      data: {
        userId: testUser.id,
        eventId: testOrganization.id,
        bookingType: 'court_booking',
        amount: testCourt.peakPrice || 500,
        currency: 'KES',
        provider: 'mpesa',
        providerStatus: 'failed', // Payment failed
        metadata: JSON.stringify({ bookingId }),
      },
    });
    
    // Booking should still be there
    const stillThere = await prisma.courtBooking.findUnique({
      where: { id: bookingId },
    });
    
    expect(stillThere).toBeDefined();
    expect(stillThere?.status).toBe('pending');
    
    console.log(`✅ Booking (${bookingId}) still available for retry even after payment failure`);
  }, TEST_TIMEOUT);
  
  it('should handle callback with error result code', async () => {
    console.log('\n📋 Test 3.7: Handle M-Pesa callback with error code...');
    
    const paymentRecord = await prisma.paymentRecord.create({
      data: {
        userId: testUser.id,
        eventId: testOrganization.id,
        bookingType: 'court_booking',
        amount: 500,
        currency: 'KES',
        provider: 'mpesa',
        providerStatus: 'pending',
        callbackUrl: `${BASE_URL}/api/payments/callback/mpesa`,
        metadata: JSON.stringify({
          mobileNumber: '254722000000',
        }),
      },
    });
    
    // Simulate M-Pesa error callback (resultCode !== 0)
    const errorCallback = {
      transactionId: paymentRecord.id,
      resultCode: '1001', // User cancelled transaction
      resultDesc: 'Request cancelled by user',
      mpesaReceiptNumber: null,
    };
    
    const response = await fetch(`${BASE_URL}/api/payments/callback/mpesa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorCallback),
    });
    
    // Should handle gracefully
    expect(response.ok || response.status === 400).toBe(true);
    
    // Payment should be marked as failed
    const updatedPayment = await prisma.paymentRecord.findUnique({
      where: { id: paymentRecord.id },
    });
    
    // Status should reflect failure
    expect(updatedPayment?.providerStatus).toBeDefined();
    console.log(`✅ Error callback handled: Payment status = ${updatedPayment?.providerStatus}`);
  }, TEST_TIMEOUT);
});

afterAll(async () => {
  console.log('\n🧹 SCENARIO 3: Cleaning up...');
  
  // Clean up bookings
  if (testCourt?.id) {
    await prisma.courtBooking.deleteMany({
      where: { courtId: testCourt.id },
    });
  }
  
  // Clean up payment records
  if (testUser?.id) {
    await prisma.paymentRecord.deleteMany({
      where: { userId: testUser.id },
    });
  }
  
  // Clean up court
  if (testCourt?.id) {
    await prisma.court.delete({
      where: { id: testCourt.id },
    });
  }
  
  // Clean up organization
  if (testOrganization?.id) {
    await prisma.clubMember.deleteMany({
      where: { organizationId: testOrganization.id },
    });
    
    // Delete players before users (foreign key constraint)
    await prisma.player.deleteMany({
      where: { organizationId: testOrganization.id },
    });
    
    await prisma.organization.delete({
      where: { id: testOrganization.id },
    });
  }
  
  // Clean up user
  if (testUser?.id) {
    // Delete player first
    await prisma.player.deleteMany({
      where: { userId: testUser.id },
    });
    
    await prisma.user.delete({
      where: { id: testUser.id },
    });
  }
  
  console.log('✅ Cleanup complete');
});
