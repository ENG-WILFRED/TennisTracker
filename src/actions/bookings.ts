"use server";

import { PrismaClient } from "@/generated/prisma";
import { OrganizationActivityTracker } from "@/lib/organizationActivity";

const prisma = new PrismaClient();

/**
 * Get available courts for a player's organization
 */
export async function getAvailableCourts(playerId: string) {
  try {
    // Find player's club membership
    const clubMember = await prisma.clubMember.findFirst({
      where: { playerId },
      include: {
        organization: true,
      },
    });

    if (!clubMember) {
      throw new Error("Player is not a member of any club");
    }

    // Get courts for the organization
    const courts = await prisma.court.findMany({
      where: {
        organizationId: clubMember.organizationId,
        status: { in: ["available", "booked"] },
      },
      select: {
        id: true,
        name: true,
        courtNumber: true,
        surface: true,
        indoorOutdoor: true,
        lights: true,
      },
    });

    return courts;
  } catch (error: any) {
    throw new Error(`Failed to fetch courts: ${error.message}`);
  }
}

/**
 * Get available time slots for a specific court on a given date
 */
export async function getAvailableTimeSlots(
  courtId: string,
  date: string,
  organizationId: string
) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get existing bookings for this court on this date
    const existingBookings = await prisma.courtBooking.findMany({
      where: {
        courtId,
        organizationId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { in: ["confirmed", "no-show"] },
      },
      select: {
        startTime: true,
        endTime: true,
        isPeak: true,
      },
    });

    // Generate time slots (6 AM to 10 PM, 1-hour slots)
    const slots = [];
    const hoursStart = 6;
    const hoursEnd = 22;
    const slotDate = new Date(date);

    // Define peak hours (typically 5 PM - 9 PM)
    const peakHourStart = 17;
    const peakHourEnd = 21;

    for (let hour = hoursStart; hour < hoursEnd; hour++) {
      const slotStart = new Date(slotDate);
      slotStart.setHours(hour, 0, 0, 0);

      const slotEnd = new Date(slotDate);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      // Check if slot is booked
      const isBooked = existingBookings.some(
        (booking) => booking.startTime < slotEnd && booking.endTime > slotStart
      );

      const isPeak = hour >= peakHourStart && hour < peakHourEnd;

      slots.push({
        hour,
        time: `${String(hour).padStart(2, "0")}:00`,
        available: !isBooked,
        isPeak,
        price: isPeak ? 80 : 50, // Default pricing - can be customized per organization
      });
    }

    return slots;
  } catch (error: any) {
    throw new Error(`Failed to fetch time slots: ${error.message}`);
  }
}

/**
 * Create a court booking
 */
export async function createCourtBooking(
  playerId: string,
  courtId: string,
  startTime: string,
  endTime: string,
  organizationId: string
) {
  try {
    // Verify player is member of organization
    const clubMember = await prisma.clubMember.findUnique({
      where: {
        organizationId_playerId: {
          organizationId,
          playerId,
        },
      },
    });

    if (!clubMember) {
      throw new Error("Player is not a member of this organization");
    }

    // Check if time slot is available
    const conflictingBooking = await prisma.courtBooking.findFirst({
      where: {
        courtId,
        organizationId,
        startTime: {
          lt: new Date(endTime),
        },
        endTime: {
          gt: new Date(startTime),
        },
        status: { in: ["confirmed", "no-show"] },
      },
    });

    if (conflictingBooking) {
      throw new Error("This time slot is already booked");
    }

    // Determine if peak hours
    const start = new Date(startTime);
    const hour = start.getHours();
    const isPeak = hour >= 17 && hour < 21;

    // Create booking
    const booking = await prisma.courtBooking.create({
      data: {
        courtId,
        organizationId,
        memberId: clubMember.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        bookingType: "regular",
        status: "confirmed",
        isPeak,
        price: isPeak ? 80 : 50,
      },
      include: {
        court: true,
        member: {
          include: {
            player: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    // Track activity for organization
    await OrganizationActivityTracker.trackActivity({
      organizationId,
      playerId,
      action: "court_booking",
      details: {
        courtName: booking.court.name,
        courtNumber: booking.court.courtNumber,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        isPeak,
        price: booking.price,
        bookingId: booking.id,
      },
      metadata: {
        courtId,
        memberId: clubMember.id,
      },
    });

    return booking;
  } catch (error: any) {
    throw new Error(`Failed to create booking: ${error.message}`);
  }
}

/**
 * Get player's bookings for a specific organization
 */
export async function getPlayerBookings(playerId: string, organizationId: string) {
  try {
    const clubMember = await prisma.clubMember.findUnique({
      where: {
        organizationId_playerId: {
          organizationId,
          playerId,
        },
      },
    });

    if (!clubMember) {
      throw new Error("Player is not a member of this organization");
    }

    const bookings = await prisma.courtBooking.findMany({
      where: {
        memberId: clubMember.id,
        organizationId,
      },
      include: {
        court: true,
      },
      orderBy: {
        startTime: "desc",
      },
    });

    return bookings;
  } catch (error: any) {
    throw new Error(`Failed to fetch bookings: ${error.message}`);
  }
}

/**
 * Cancel a court booking
 */
export async function cancelCourtBooking(
  bookingId: string,
  playerId: string,
  cancellationReason?: string
) {
  try {
    // Verify the booking belongs to the player
    const booking = await prisma.courtBooking.findUnique({
      where: { id: bookingId },
      include: {
        member: true,
      },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.member?.playerId !== playerId) {
      throw new Error("You can only cancel your own bookings");
    }

    // Check if booking is in the future
    if (booking.startTime < new Date()) {
      throw new Error("Cannot cancel past bookings");
    }

    // Update booking status
    const updated = await prisma.courtBooking.update({
      where: { id: bookingId },
      data: {
        status: "cancelled",
        cancellationReason,
        cancelledAt: new Date(),
      },
      include: {
        court: true,
      },
    });

    return updated;
  } catch (error: any) {
    throw new Error(`Failed to cancel booking: ${error.message}`);
  }
}
