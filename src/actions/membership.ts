"use server";

import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

/**
 * Get all membership tiers for an organization
 */
export async function getMembershipTiers(organizationId: string) {
  try {
    const tiers = await prisma.membershipTier.findMany({
      where: {
        organizationId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        monthlyPrice: true,
        courtHoursPerMonth: true,
        maxConcurrentBookings: true,
        discountPercentage: true,
        benefitsJson: true,
      },
      orderBy: {
        monthlyPrice: 'asc',
      },
    });

    const formattedTiers = tiers.map((tier) => ({
      ...tier,
      benefits: tier.benefitsJson ? JSON.parse(tier.benefitsJson) : [],
      guestSurcharge: 50, // 50% extra for guests (they save this by joining)
    }));

    return formattedTiers;
  } catch (error: any) {
    console.error(`Failed to fetch membership tiers:`, error.message);
    return [];
  }
}

/**
 * Create a membership purchase request (before payment)
 * Returns payment details for the client to process
 */
export async function createMembershipPurchase(
  playerId: string,
  organizationId: string,
  tierId: string,
  paymentMethod: "mpesa" | "stripe" | "paypal",
  mobileNumber?: string
) {
  try {
    // Check if player already a member
    const existingMember = await prisma.clubMember.findUnique({
      where: {
        organizationId_playerId: {
          organizationId,
          playerId,
        },
      },
    });

    if (existingMember) {
      throw new Error("Player is already a member of this organization");
    }

    // Get tier details
    const tier = await prisma.membershipTier.findUnique({
      where: { id: tierId },
      select: {
        id: true,
        name: true,
        monthlyPrice: true,
      },
    });

    if (!tier || tier.id !== tierId) {
      throw new Error("Membership tier not found");
    }

    // Create a temporary membership purchase record for payment processing
    // This is stored to track pending payments
    const purchaseData = {
      playerId,
      organizationId,
      tierId,
      amount: tier.monthlyPrice,
      paymentMethod,
      mobileNumber: mobileNumber || "",
      status: "pending",
    };

    // Return payment details for the client to process
    return {
      success: true,
      tierName: tier.name,
      monthlyPrice: tier.monthlyPrice,
      paymentMethod,
      message: `Ready to process ${tier.name} membership payment`,
      data: purchaseData,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Confirm membership purchase and add user as club member
 * Call this after payment is confirmed
 */
export async function confirmMembershipPurchase(
  playerId: string,
  organizationId: string,
  tierId: string,
  paymentTransactionId: string,
  paymentMethod: string,
  bookingIdToUpgrade?: string // Optional: booking to upgrade from guest to member
) {
  try {
    // Verify player exists
    const player = await prisma.player.findUnique({
      where: { userId: playerId },
      select: { userId: true },
    });

    if (!player) {
      throw new Error("Player not found");
    }

    // Check if already a member
    const existingMember = await prisma.clubMember.findUnique({
      where: {
        organizationId_playerId: {
          organizationId,
          playerId,
        },
      },
    });

    if (existingMember) {
      throw new Error("Player is already a member of this organization");
    }

    // Get tier details
    const tier = await prisma.membershipTier.findUnique({
      where: { id: tierId },
      select: {
        id: true,
        name: true,
        monthlyPrice: true,
      },
    });

    if (!tier) {
      throw new Error("Membership tier not found");
    }

    // Create club member record
    const clubMember = await prisma.clubMember.create({
      data: {
        organizationId,
        playerId,
        tierId,
        joinDate: new Date(),
        // Optional: set expiry date for annual/monthly billing
        // expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      include: {
        membershipTier: true,
        organization: true,
      },
    });

    // If there's a booking to upgrade, update it from guest to member pricing
    if (bookingIdToUpgrade) {
      try {
        const booking = await prisma.courtBooking.findUnique({
          where: { id: bookingIdToUpgrade },
          include: { court: true },
        });

        if (booking && booking.bookingType === "guest") {
          // Calculate member price
          const memberPrice = booking.isPeak ? 100 : 80;
          
          // Update booking: add member, change type, update price, confirm status
          await prisma.courtBooking.update({
            where: { id: bookingIdToUpgrade },
            data: {
              memberId: clubMember.id,
              bookingType: "member",
              price: memberPrice,
              status: "confirmed",
            },
          });
        }
      } catch (err) {
        console.warn("Could not upgrade booking:", err);
        // Continue anyway - membership was created successfully
      }
    }

    // Log the membership purchase in activity tracker if available
    try {
      const { OrganizationActivityTracker } = await import(
        "@/lib/organizationActivity"
      );
      await OrganizationActivityTracker.trackActivity({
        organizationId,
        playerId,
        action: "membership_purchased",
        details: {
          tierName: tier.name,
          monthlyPrice: tier.monthlyPrice,
          transactionId: paymentTransactionId,
          paymentMethod,
          bookingUpgrade: bookingIdToUpgrade ? "yes" : "no",
        },
        metadata: {
          memberId: clubMember.id,
          transactionId: paymentTransactionId,
          bookingId: bookingIdToUpgrade,
        },
      });
    } catch (err) {
      console.warn("Could not log activity:", err);
    }

    return {
      success: true,
      clubMember,
      message: `Welcome to ${tier.name} membership at ${clubMember.organization.name}!`,
      tier: tier.name,
    };
  } catch (error: any) {
    console.error("Membership confirmation error:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Calculate savings for guest when they buy membership
 * Compares guest surcharge vs membership cost
 */
export async function calculateMembershipSavings(
  organizationId: string,
  tierId: string,
  estimatedMonthlyBookings: number = 4 // Default: 4 bookings per month
) {
  try {
    // Get tier details
    const tier = await prisma.membershipTier.findUnique({
      where: { id: tierId },
      select: {
        name: true,
        monthlyPrice: true,
        discountPercentage: true,
      },
    });

    if (!tier) {
      throw new Error("Membership tier not found");
    }

    // Average booking cost: 100 (member), 150 (guest)
    const avgMemberBooking = 100;
    const guestSurcharge = 50; // 50% extra

    const guestCost = estimatedMonthlyBookings * (avgMemberBooking + guestSurcharge);
    const memberCost = tier.monthlyPrice;
    const savings = guestCost - memberCost;
    const breakEvenBookings = Math.ceil(memberCost / guestSurcharge);

    return {
      tier: tier.name,
      monthlyMembershipCost: memberCost,
      estimatedMonthlyGuestCost: guestCost,
      estimatedSavings: savings,
      breakEvenBookings, // How many bookings to pay for itself
      totalSavingsYearly: savings * 12,
      discount: tier.discountPercentage || 0,
    };
  } catch (error: any) {
    console.error("Savings calculation error:", error.message);
    return null;
  }
}
