/**
 * API: Backfill revenue for completed sessions without revenue
 * 
 * Purpose: Process completed sessions that don't have corresponding revenue records
 * (e.g., from seeding or legacy data)
 * 
 * Usage: POST /api/sessions/backfill-revenue
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export async function POST(req: NextRequest) {
  try {
    console.log('[Backfill] Starting revenue backfill for completed sessions...');

    // 1. Find all completed sessions without payment records
    const completedSessionsWithoutPayment = await prisma.coachSession.findMany({
      where: {
        status: 'completed',
        sessionPayment: null, // No payment record yet
      },
      include: {
        bookings: {
          take: 1,
          select: { playerId: true },
        },
        organization: {
          select: {
            id: true,
            coachingPricing: {
              select: {
                pricePerHour: true,
                roundingType: true,
              },
            },
          },
        },
        coach: {
          select: {
            userId: true,
            pricing: {
              select: {
                commissionRate: true,
              },
            },
          },
        },
      },
    });

    console.log(`[Backfill] Found ${completedSessionsWithoutPayment.length} completed sessions without revenue`);

    if (completedSessionsWithoutPayment.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No sessions to backfill',
        processed: 0,
      });
    }

    // Helper function to calculate duration in hours
    const calculateDurationHours = (startTime: Date, endTime: Date, roundingType: string = 'up'): number => {
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationMinutes = Math.ceil(durationMs / (1000 * 60));
      const durationHours = durationMinutes / 60;

      switch (roundingType) {
        case 'down':
          return Math.floor(durationHours * 4) / 4;
        case 'nearest':
          return Math.round(durationHours * 4) / 4;
        case 'up':
        default:
          return Math.ceil(durationHours * 4) / 4;
      }
    };

    let processedCount = 0;
    let errorCount = 0;
    const results: any[] = [];

    // 2. Process each session
    for (const session of completedSessionsWithoutPayment) {
      try {
        const primaryBooking = session.bookings[0];
        if (!primaryBooking) {
          console.log(`[Backfill] ⚠ Session ${session.id} has no bookings, skipping`);
          errorCount++;
          continue;
        }

        const organizationId = session.organizationId;
        if (!organizationId) {
          console.log(`[Backfill] ⚠ Session ${session.id} has no organization, skipping`);
          errorCount++;
          continue;
        }
        const pricePerHour = session.organization?.coachingPricing?.pricePerHour ?? 45;
        const roundingType = session.organization?.coachingPricing?.roundingType ?? 'up';
        const commissionRate = session.coach?.pricing?.commissionRate ?? 0.6;

        // Calculate price from session or derive from duration
        let finalPrice: number;
        if (session.price) {
          finalPrice = session.price;
        } else {
          const durationHours = calculateDurationHours(session.startTime, session.endTime, roundingType);
          finalPrice = parseFloat((durationHours * pricePerHour).toFixed(2));
        }

        const durationMinutes = Math.ceil((session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60));
        const durationHours = new Decimal(calculateDurationHours(session.startTime, session.endTime, roundingType));
        const amountDecimal = new Decimal(finalPrice);
        const coachEarnings = amountDecimal.mul(new Decimal(commissionRate));

        // 3. Create session payment record
        const sessionPayment = await prisma.sessionPayment.create({
          data: {
            sessionId: session.id,
            organizationId,
            playerId: primaryBooking.playerId,
            coachId: session.coachId,
            playerTier: 'standard',
            amount: amountDecimal,
            durationMinutes,
            durationHours,
            pricePerHour: new Decimal(pricePerHour),
            pricingRuleType: 'base',
            coachEarnings,
            coachCommissionRate: new Decimal(commissionRate),
            status: 'completed', // Already completed
            chargedAt: new Date(),
          },
        });

        // 4. Create or update revenue
        const revenue = await prisma.orgRevenue.create({
          data: {
            organizationId,
            sessionIds: [session.id],
            amount: amountDecimal,
            paymentType: 'per_session',
            fromPlayerId: primaryBooking.playerId,
            status: 'confirmed',
            recordedAt: new Date(),
            paymentMethod: 'backfill',
          },
        });

        // 5. Update user debt (if player hasn't paid)
        const userDebt = await prisma.userOrgDebt.upsert({
          where: {
            userId_organizationId: {
              userId: primaryBooking.playerId,
              organizationId,
            },
          },
          create: {
            userId: primaryBooking.playerId,
            organizationId,
            totalAmount: amountDecimal,
            paidAmount: new Decimal(0),
            outstandingAmount: amountDecimal,
            status: 'active',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          update: {
            totalAmount: { increment: amountDecimal },
            outstandingAmount: { increment: amountDecimal },
            updatedAt: new Date(),
          },
        });

        // 6. Record coach earnings
        const coachEarning = await prisma.coachEarning.create({
          data: {
            sessionId: session.id,
            coachId: session.coachId,
            organizationId,
            sessionPrice: amountDecimal,
            coachPercentage: new Decimal(commissionRate),
            amount: coachEarnings,
            status: 'completed',
          },
        });

        // 7. Update coach wallet
        const coachWallet = await prisma.coachWallet.upsert({
          where: { coachId: session.coachId },
          create: {
            coachId: session.coachId,
            balance: coachEarnings.toNumber(),
            totalEarned: coachEarnings.toNumber(),
            pendingBalance: coachEarnings.toNumber(),
          },
          update: {
            totalEarned: { increment: coachEarnings.toNumber() },
            balance: { increment: coachEarnings.toNumber() },
          },
        });

        processedCount++;
        results.push({
          sessionId: session.id,
          status: 'success',
          price: finalPrice,
          coachEarning: coachEarnings.toNumber(),
          revenue: revenue.id,
        });

        console.log(`[Backfill] ✓ Session ${session.id}: $${finalPrice} revenue created`);
      } catch (err) {
        errorCount++;
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[Backfill] ✗ Error processing session:`, errMsg);
        results.push({
          sessionId: session.id,
          status: 'error',
          error: errMsg,
        });
      }
    }

    console.log(`[Backfill] Complete: ${processedCount} success, ${errorCount} errors`);

    return NextResponse.json({
      success: errorCount === 0,
      processed: processedCount,
      errors: errorCount,
      results,
      message: `Backfilled ${processedCount} sessions. ${errorCount} errors.`,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[Backfill] Fatal error:', errMsg);

    return NextResponse.json(
      { error: errMsg, success: false },
      { status: 500 }
    );
  }
}
