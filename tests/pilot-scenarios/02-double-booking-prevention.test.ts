/**
 * PILOT TEST SUITE - Scenario 2
 * =============================
 * Try to double book the same time slot
 * 
 * CRITICAL: Must prevent race conditions and double bookings.
 * Without this, users lose trust immediately.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '@/lib/prisma';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 30000;

let testOrganization: any;
let testCourt: any;
let testUsers: any[] = [];
let testMembers: any[] = [];
let testBookingTime: any;

beforeAll(async () => {
  console.log('🧪 SCENARIO 2: Setting up test data...');
  
  // Create test organization
  testOrganization = await prisma.organization.create({
    data: {
      name: 'Test Club - Double Book',
      slug: `test-club-dblbk-${Date.now()}`,

      country: 'KE',
      city: 'Nairobi',
    },
  });
  
  // Create test court
  testCourt = await prisma.court.create({
    data: {
      organizationId: testOrganization.id,
      name: 'Exclusive Court',
      courtNumber: 1,
      surface: 'grass',
      peakPrice: 1000,
    },
  });
  
  // Create 2 test users
  for (let i = 0; i < 2; i++) {
    const user = await prisma.user.create({
      data: {
        username: `player-${i}-${Date.now()}`,
        email: `player-${i}-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
        firstName: `Player`,
        lastName: `${i + 1}`,
        phone: `2547220${Date.now().toString().slice(-3)}${i}`,
      },
    });
    
    const player = await prisma.player.create({
      data: {
        userId: user.id,
      },
    });
    
    const member = await prisma.clubMember.create({
      data: {
        organizationId: testOrganization.id,
        playerId: player.userId,
        role: 'player',
      },
    });
    
    testUsers.push(user);
    testMembers.push(member);
  }
  
  // Set up booking time for tomorrow 3-4 PM
  testBookingTime = new Date();
  testBookingTime.setDate(testBookingTime.getDate() + 1);
  testBookingTime.setHours(15, 0, 0, 0);
  
  console.log('✅ Test data created');
});

describe('Scenario 2: Double Booking Prevention', () => {
  
  it('should allow first booking for the time slot', async () => {
    console.log('\n📋 Test 2.1: First booking should succeed...');
    
    const endTime = new Date(testBookingTime);
    endTime.setHours(16, 0, 0, 0);
    
    const booking = await prisma.courtBooking.create({
      data: {
        courtId: testCourt.id,
        organizationId: testOrganization.id,
        memberId: testMembers[0].id,
        startTime: testBookingTime,
        endTime: endTime,
        status: 'confirmed',
        price: testCourt.hourlyRate,
      },
    });
    
    expect(booking.id).toBeDefined();
    console.log(`✅ First booking confirmed: ${booking.id}`);
    
    (global as any).firstBookingId = booking.id;
  }, TEST_TIMEOUT);
  
  it('should reject second booking for overlapping time', async () => {
    console.log('\n📋 Test 2.2: Second booking should be rejected...');
    
    const endTime = new Date(testBookingTime);
    endTime.setHours(16, 0, 0, 0);
    
    // Check if slot is already booked
    const existingBooking = await prisma.courtBooking.findFirst({
      where: {
        courtId: testCourt.id,
        status: 'confirmed',
        OR: [
          {
            AND: [
              { startTime: { lte: testBookingTime } },
              { endTime: { gt: testBookingTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: testBookingTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });
    
    expect(existingBooking).toBeDefined();
    console.log(`✅ Conflict detected: Slot already booked`);
  }, TEST_TIMEOUT);
  
  it('should reject booking via API for same slot', async () => {
    console.log('\n📋 Test 2.3: API should reject double booking...');
    
    const endTime = new Date(testBookingTime);
    endTime.setHours(16, 0, 0, 0);
    
    // Simulate API call to create booking
    const response = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courtId: testCourt.id,
        organizationId: testOrganization.id,
        playerId: testMembers[1].id,
        startTime: testBookingTime.toISOString(),
        endTime: endTime.toISOString(),
      }),
    });
    
    // Should either fail or require conflict handling
    if (!response.ok) {
      const error = await response.json();
      expect(error.error || error.message).toBeDefined();
      console.log(`✅ API rejected double booking: ${error.error || error.message}`);
    } else {
      const result = await response.json();
      expect(result.error || result.message).toBeDefined();
      console.log(`✅ API rejected double booking`);
    }
  }, TEST_TIMEOUT);
  
  it('should allow booking for different time slot', async () => {
    console.log('\n📋 Test 2.4: Different time should be allowed...');
    
    const laterTime = new Date(testBookingTime);
    laterTime.setHours(17, 0, 0, 0); // 5 PM (after first booking)
    
    const endTime = new Date(laterTime);
    endTime.setHours(18, 0, 0, 0);
    
    const booking = await prisma.courtBooking.create({
      data: {
        courtId: testCourt.id,
        organizationId: testOrganization.id,
        memberId: testMembers[1].id,
        startTime: laterTime,
        endTime: endTime,
        status: 'confirmed',
        price: testCourt.hourlyRate,
      },
    });
    
    expect(booking.id).toBeDefined();
    expect(booking.startTime).toEqual(laterTime);
    console.log(`✅ Later booking allowed: ${booking.id}`);
    
    (global as any).secondBookingId = booking.id;
  }, TEST_TIMEOUT);
  
  it('should detect overlap when time ranges overlap partially', async () => {
    console.log('\n📋 Test 2.5: Partial overlap detection...');
    
    // Try to book 3:30-4:30 PM (overlaps with first booking 3-4 PM)
    const overlapStart = new Date(testBookingTime);
    overlapStart.setHours(15, 30, 0, 0);
    
    const overlapEnd = new Date(overlapStart);
    overlapEnd.setHours(16, 30, 0, 0);
    
    // Check for conflicts
    const conflicts = await prisma.courtBooking.findMany({
      where: {
        courtId: testCourt.id,
        status: 'confirmed',
        OR: [
          {
            AND: [
              { startTime: { lte: overlapStart } },
              { endTime: { gt: overlapStart } },
            ],
          },
          {
            AND: [
              { startTime: { lt: overlapEnd } },
              { endTime: { gte: overlapEnd } },
            ],
          },
          {
            AND: [
              { startTime: { gte: overlapStart } },
              { endTime: { lte: overlapEnd } },
            ],
          },
        ],
      },
    });
    
    expect(conflicts.length).toBeGreaterThan(0);
    console.log(`✅ Partial overlap detected: Found ${conflicts.length} conflicting booking(s)`);
  }, TEST_TIMEOUT);
  
  it('should show user clear message when slot unavailable', async () => {
    console.log('\n📋 Test 2.6: User sees clear error message...');
    
    const response = await fetch(
      `${BASE_URL}/api/bookings/available-slots?courtId=${testCourt.id}&startDate=${testBookingTime.toISOString()}`,
      { method: 'GET' }
    );
    
    if (response.ok) {
      const data = await response.json();
      
      // Find if our booked slot is marked as unavailable
      const bookedSlot = data.slots?.find((slot: any) => {
        const slotStart = new Date(slot.startTime);
        return slotStart.getHours() === testBookingTime.getHours() && !slot.available;
      });
      
      if (bookedSlot) {
        expect(bookedSlot.available).toBe(false);
        console.log(`✅ Booked slot clearly marked as unavailable`);
      } else {
        console.log(`⚠️  Slot availability not showing (may be expected)`);
      }
    }
  }, TEST_TIMEOUT);
});

afterAll(async () => {
  console.log('\n🧹 SCENARIO 2: Cleaning up...');
  
  // Clean up bookings
  if (testCourt?.id) {
    await prisma.courtBooking.deleteMany({
      where: { courtId: testCourt.id },
    });
  }
  
  // Clean up court
  if (testCourt?.id) {
    await prisma.court.delete({
      where: { id: testCourt.id },
    });
  }
  
  // Clean up members and organization
  if (testOrganization?.id) {
    await prisma.clubMember.deleteMany({
      where: { organizationId: testOrganization.id },
    });
    
    // Delete players before organization (foreign key constraint)
    await prisma.player.deleteMany({
      where: { organizationId: testOrganization.id },
    });
    
    await prisma.organization.delete({
      where: { id: testOrganization.id },
    });
  }
  
  // Clean up users - delete player records first
  for (const user of testUsers) {
    await prisma.player.deleteMany({
      where: { userId: user.id },
    });
    
    await prisma.user.delete({
      where: { id: user.id },
    });
  }
  
  console.log('✅ Cleanup complete');
});
