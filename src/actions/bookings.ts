"use server";

import { PrismaClient } from "@/generated/prisma";
import { OrganizationActivityTracker } from "@/lib/organizationActivity";

const prisma = new PrismaClient();

/**
 * Get all available organizations in the database
 */
export async function getAllAvailableOrganizations() {
  try {
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        city: true,
        country: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    if (organizations.length === 0) {
      throw new Error("No organizations found in the database");
    }

    return organizations;
  } catch (error: any) {
    throw new Error(`Failed to fetch organizations: ${error.message}`);
  }
}

/**
 * Get all organizations a player belongs to (as member and as owner)
 */
export async function getPlayerOrganizations(playerId: string) {
  try {
    // Get player details to check if they own an organization
    const player = await prisma.player.findUnique({
      where: { userId: playerId },
      select: { organizationId: true },
    });

    // Get all club memberships
    const memberships = await prisma.clubMember.findMany({
      where: { playerId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Convert memberships to organization list
    const organizationIds = new Set<string>();
    const organizations: Array<{ id: string; name: string; role: string }> = [];

    // Add club memberships
    memberships.forEach((m) => {
      organizationIds.add(m.organization.id);
      organizations.push({
        id: m.organization.id,
        name: m.organization.name,
        role: m.role,
      });
    });

    // Add owned organization if player owns one and it's not already in the list
    if (player?.organizationId && !organizationIds.has(player.organizationId)) {
      const ownedOrg = await prisma.organization.findUnique({
        where: { id: player.organizationId },
        select: { id: true, name: true },
      });

      if (ownedOrg) {
        organizations.push({
          id: ownedOrg.id,
          name: ownedOrg.name,
          role: "OWNER",
        });
      }
    }

    if (organizations.length === 0) {
      // Log but don't expose membership details
      console.warn(`[SECURITY AUDIT] User ${playerId} has no organization memberships`);
      return []; // Return empty array instead of throwing error
    }

    return organizations;
  } catch (error: any) {
    // Log error but don't expose details
    console.error(`[ERROR] Failed to fetch player organizations for ${playerId}:`, error.message);
    return []; // Return empty array on error
  }
}

/**
 * Get available courts for an organization (accessible to any player)
 */
export async function getAvailableCourts(playerId: string, organizationId?: string) {
  try {
    let orgId = organizationId;

    // If no organizationId provided, get the first organization in the database
    if (!orgId) {
      const firstOrg = await prisma.organization.findFirst({
        select: { id: true },
        orderBy: { name: 'asc' },
      });

      if (!firstOrg) {
        throw new Error("No organizations found in the database");
      }

      orgId = firstOrg.id;
    }

    // Verify the organization exists
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true },
    });

    if (!org) {
      throw new Error("Organization not found");
    }

    // Get courts for the organization
    const courts = await prisma.court.findMany({
      where: {
        organizationId: orgId,
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
    // Validate date string
    if (!date || typeof date !== 'string') {
      throw new Error('Invalid date provided');
    }

    // Parse date string (format: YYYY-MM-DD)
    const [year, month, day] = date.split('-').map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    // Check if date is valid
    if (isNaN(startOfDay.getTime())) {
      throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD format`);
    }

    // Get confirmed/no-show bookings (these slots are fully booked/disabled)
    const confirmedBookings = await prisma.courtBooking.findMany({
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

    // Get pending bookings (show count on slots, can be cancelled/rejected)
    const pendingBookings = await prisma.courtBooking.findMany({
      where: {
        courtId,
        organizationId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: "pending",
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Convert bookings to comparable times
    const confirmedTimes = confirmedBookings.map(b => ({
      start: new Date(b.startTime).getTime(),
      end: new Date(b.endTime).getTime(),
    }));

    const pendingTimes = pendingBookings.map(b => ({
      start: new Date(b.startTime).getTime(),
      end: new Date(b.endTime).getTime(),
    }));

    // Generate time slots (6 AM to 10 PM, 1-hour slots)
    const slots = [];
    const hoursStart = 6;
    const hoursEnd = 22;

    // Define peak hours (typically 5 PM - 9 PM)
    const peakHourStart = 17;
    const peakHourEnd = 21;

    for (let hour = hoursStart; hour < hoursEnd; hour++) {
      const slotStart = new Date(year, month - 1, day, hour, 0, 0, 0);
      const slotEnd = new Date(year, month - 1, day, hour + 1, 0, 0, 0);

      const slotStartTime = slotStart.getTime();
      const slotEndTime = slotEnd.getTime();

      // Check if slot is booked (confirmed/no-show)
      // Overlap when: booking.start < slot.end AND booking.end > slot.start
      const isBooked = confirmedTimes.some(
        (booking) => booking.start < slotEndTime && booking.end > slotStartTime
      );

      // Count pending bookings for this slot
      const pendingCount = pendingTimes.filter(
        (booking) => booking.start < slotEndTime && booking.end > slotStartTime
      ).length;

      const isPeak = hour >= peakHourStart && hour < peakHourEnd;

      slots.push({
        hour,
        time: `${String(hour).padStart(2, "0")}:00`,
        available: !isBooked,
        pendingCount,
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
 * Create a booking preview (calculation only, not saved to database)
 * Used for guests to see pricing before committing
 */
export async function createBookingPreview(
  playerId: string,
  courtId: string,
  startTime: string,
  endTime: string,
  organizationId: string
) {
  try {
    const clubMember = await prisma.clubMember.findUnique({
      where: {
        organizationId_playerId: {
          organizationId,
          playerId,
        },
      },
    });

    const isMember = !!clubMember;
    const start = new Date(startTime);
    const hour = start.getHours();
    const isPeak = hour >= 17 && hour < 21;

    const memberPrice = isPeak ? 100 : 80;
    const guestPrice = memberPrice * 1.5;

    const court = await prisma.court.findUnique({
      where: { id: courtId },
    });

    return {
      court,
      startTime,
      endTime,
      memberPrice,
      guestPrice,
      isPeak,
      isMember,
      bookingType: isMember ? "member" : "guest",
    };
  } catch (error: any) {
    throw new Error(`Failed to create booking preview: ${error.message}`);
  }
}

/**
 * Create a court booking (members and non-members can book)
 * Returns booking info + membership status
 */
export async function createCourtBooking(
  playerId: string,
  courtId: string,
  startTime: string,
  endTime: string,
  organizationId: string
) {
  try {
    // Check if player is a member of this organization
    const clubMember = await prisma.clubMember.findUnique({
      where: {
        organizationId_playerId: {
          organizationId,
          playerId,
        },
      },
    });

    const isMember = !!clubMember;

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

    // Calculate price based on membership status
    // Guests pay 1.5x the member price
    const memberPrice = isPeak ? 100 : 80;
    const guestPrice = memberPrice * 1.5; // 150 or 120

    // Get player name for the booking
    const player = await prisma.player.findUnique({
      where: { userId: playerId },
      include: { user: true },
    });

    const playerName = player?.user?.firstName 
      ? `${player.user.firstName} ${player.user.lastName || ''}`.trim()
      : player?.user?.email || 'Unknown';

    // Create booking (with or without club member)
    const booking = await prisma.courtBooking.create({
      data: {
        courtId,
        organizationId,
        memberId: clubMember?.id || null, // null if non-member
        playerName, // Set player name for booking record
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        price: isMember ? memberPrice : guestPrice, // Apply guest surcharge
        status: "pending",
        isPeak,
        bookingType: isMember ? "member" : "guest",
      },
      include: {
        court: true,
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
        membershipStatus: isMember ? "member" : "non-member",
      },
      metadata: {
        courtId,
        memberId: clubMember?.id || null,
        bookingType: isMember ? "member" : "guest",
      },
    });

    return {
      booking,
      isMember,
      membershipStatus: isMember ? "member" : "non-member",
      message: isMember ? "Booking confirmed as club member" : "Booking confirmed as guest (non-member)",
    };
  } catch (error: any) {
    throw new Error(`Failed to create booking: ${error.message}`);
  }
}

/**
 * Get player's bookings (including member and non-member bookings)
 */
export async function getPlayerBookings(playerId: string, organizationId: string) {
  try {
    // Get the club member record if it exists
    const clubMember = await prisma.clubMember.findUnique({
      where: {
        organizationId_playerId: {
          organizationId,
          playerId,
        },
      },
    });

    // Query all bookings for this player in this organization
    // If they're a member, get their member bookings
    // Other non-member bookings can be fetched via direct playerId tracking if available
    const whereCondition: any = {
      organizationId,
    };

    if (clubMember) {
      whereCondition.memberId = clubMember.id;
    } else {
      // For non-members, return empty (can be extended if you want to track non-member bookings separately)
      return [];
    }

    const bookings = await prisma.courtBooking.findMany({
      where: whereCondition,
      include: {
        court: true,
      },
      orderBy: {
        startTime: "desc",
      },
    });

    return bookings;
  } catch (error: any) {
    // Log the actual error for debugging but don't expose it to client
    console.error(`[ERROR] Failed to fetch bookings for player ${playerId}:`, error.message);
    return []; // Return empty array on error for consistency
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
      console.warn(`[SECURITY AUDIT] User ${playerId} attempted to cancel non-existent booking ${bookingId}`);
      throw new Error("Could not process your request. The booking may not exist or you may not have access to it.");
    }

    // Check membership: 
    // - If member exists, verify playerId matches
    // - If no member (guest/non-member booking), allow cancel if they have the bookingId
    const isMemberBooking = !!booking.member;
    
    if (isMemberBooking && booking.member?.playerId !== playerId) {
      console.warn(`[SECURITY AUDIT] User ${playerId} attempted to cancel booking ${bookingId} of another member`);
      throw new Error("Could not process your request. The booking may not exist or you may not have access to it.");
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

/**
 * Update booking after membership purchase
 * Changes booking type from guest to member and recalculates price
 */
export async function updateBookingForMembership(
  bookingId: string,
  playerId: string,
  organizationId: string,
  memberId: string
) {
  try {
    // Get the booking
    const booking = await prisma.courtBooking.findUnique({
      where: { id: bookingId },
      include: { court: true },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Verify it's a guest booking
    if (booking.bookingType !== "guest") {
      throw new Error("Only guest bookings can be converted to member bookings");
    }

    // Calculate new member price
    const isPeak = booking.isPeak;
    const memberPrice = isPeak ? 100 : 80;

    // Update the booking
    const updated = await prisma.courtBooking.update({
      where: { id: bookingId },
      data: {
        memberId,
        bookingType: "member",
        price: memberPrice,
        status: "confirmed",
      },
      include: { court: true },
    });

    // Track activity
    await OrganizationActivityTracker.trackActivity({
      organizationId,
      playerId,
      action: "booking_upgraded_to_member",
      details: {
        bookingId,
        courtName: updated.court.name,
        oldPrice: booking.price ?? 0,
        newPrice: memberPrice,
        savings: (booking.price ?? 0) - memberPrice,
      },
    });

    return updated;
  } catch (error: any) {
    throw new Error(`Failed to update booking: ${error.message}`);
  }
}
