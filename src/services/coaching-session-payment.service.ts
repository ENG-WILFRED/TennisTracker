import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Coaching Session Payment Service with Flexible Pricing
 * 
 * Handles:
 * - Session completion and marking by coach
 * - Player confirmation of session
 * - Flexible billing calculation based on tier and coach
 * - Coach earnings credit
 * - User debt tracking to organization
 */

interface MarkCoachSessionCompleteInput {
  sessionId: string;
  coachId: string;
  organizationId: string;
}

interface ConfirmPlayerSessionInput {
  sessionId: string;
  playerId: string;
  attendanceStatus: 'attended' | 'absent' | 'late';
}

interface SessionPaymentResult {
  sessionPayment: any;
  userDebt: any;
  coachEarning: any;
  coachWallet: any;
}

interface PricingRule {
  pricePerHour: number;
  ruleType: 'base' | 'tier' | 'coach' | 'coach_tier';
  tierPriceId?: string;
  coachPriceId?: string;
  tierName?: string | null;
  source: string;
}

export class CoachingSessionPaymentService {
  /**
   * Calculate session duration in hours
   */
  private calculateDurationHours(startTime: Date, endTime: Date, roundingType: string = 'up'): Decimal {
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.ceil(durationMs / (1000 * 60));
    const durationHours = durationMinutes / 60;

    let roundedHours: number;
    switch (roundingType) {
      case 'down':
        roundedHours = Math.floor(durationHours * 4) / 4;
        break;
      case 'nearest':
        roundedHours = Math.round(durationHours * 4) / 4;
        break;
      case 'up':
      default:
        roundedHours = Math.ceil(durationHours * 4) / 4;
        break;
    }

    return new Decimal(roundedHours);
  }

  /**
   * Get player's membership tier
   */
  private async getPlayerTier(playerId: string, organizationId: string): Promise<string | null> {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId: playerId,
          orgId: organizationId,
        },
      },
    });

    if (membership?.role && membership.role !== 'player') {
      return membership.role;
    }

    return null;
  }

  /**
   * Determine pricing based on hierarchy:
   * 1. Coach + Tier specific price
   * 2. Coach only price
   * 3. Tier price
   * 4. Organization base price
   */
  async determinePricingRule(
    coachId: string,
    playerId: string,
    organizationId: string
  ): Promise<PricingRule> {
    const orgPricing = await prisma.orgCoachingPricing.findUnique({
      where: { organizationId },
    });

    if (!orgPricing) {
      throw new Error(`Coaching pricing not configured for organization ${organizationId}`);
    }

    const playerTier = await this.getPlayerTier(playerId, organizationId);

    // 1. Check coach + tier specific price
    if (playerTier) {
      const coachTierPrice = await prisma.coachSpecificPrice.findUnique({
        where: {
          pricingId_coachId_tierName: {
            pricingId: orgPricing.id,
            coachId,
            tierName: null as any,
          },
        },
      });

      if (coachTierPrice && coachTierPrice.isActive) {
        return {
          pricePerHour: coachTierPrice.pricePerHour,
          ruleType: 'coach_tier',
          coachPriceId: coachTierPrice.id,
          tierName: playerTier,
          source: `Coach specialty rate for ${playerTier} members`,
        };
      }
    }

    // 2. Check coach-only price
    const coachPrice = await prisma.coachSpecificPrice.findUnique({
      where: {
        pricingId_coachId_tierName: {
          pricingId: orgPricing.id,
          coachId,
          tierName: null as any,
        },
      },
    });

    if (coachPrice && coachPrice.isActive) {
      return {
        pricePerHour: coachPrice.pricePerHour,
        ruleType: 'coach',
        coachPriceId: coachPrice.id,
        source: `${coachPrice.description || 'Coach custom rate'}`,
      };
    }

    // 3. Check tier-specific price
    if (playerTier) {
      const tierPrice = await prisma.tierCoachingPrice.findUnique({
        where: {
          pricingId_tierName: {
            pricingId: orgPricing.id,
            tierName: playerTier,
          },
        },
      });

      if (tierPrice && tierPrice.isActive) {
        return {
          pricePerHour: tierPrice.pricePerHour,
          ruleType: 'tier',
          tierPriceId: tierPrice.id,
          tierName: playerTier,
          source: `${playerTier} member pricing`,
        };
      }
    }

    // 4. Fall back to organization base price
    return {
      pricePerHour: orgPricing.pricePerHour,
      ruleType: 'base',
      source: `Standard organization rate`,
    };
  }

  /**
   * Mark coaching session as complete by coach
   * Uses flexible pricing based on coach and tier
   */
  async markSessionComplete(input: MarkCoachSessionCompleteInput): Promise<SessionPaymentResult> {
    const { sessionId, coachId, organizationId } = input;

    return await prisma.$transaction(async (tx) => {
      const session = await tx.coachSession.findUnique({
        where: { id: sessionId },
        include: { bookings: true },
      });

      if (!session) throw new Error(`Session ${sessionId} not found`);
      if (session.coachId !== coachId) throw new Error('Only the coach can mark the session as complete');

      const orgPricing = await tx.orgCoachingPricing.findUnique({
        where: { organizationId },
      });

      if (!orgPricing) throw new Error(`Coaching pricing not configured for organization ${organizationId}`);

      const primaryBooking = session.bookings[0];
      if (!primaryBooking) throw new Error('Session must have at least one player booking');

      const playerTier = await this.getPlayerTier(primaryBooking.playerId, organizationId);
      const pricingRule = await this.determinePricingRule(coachId, primaryBooking.playerId, organizationId);

      const durationMinutes = Math.ceil((session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60));
      const durationHours = this.calculateDurationHours(session.startTime, session.endTime, orgPricing.roundingType);
      const amountDecimal = durationHours.mul(new Decimal(pricingRule.pricePerHour));

      const coachPricing = await tx.coachPricing.findUnique({
        where: { staffId: coachId },
      });
      const coachCommissionRate = coachPricing?.commissionRate ?? 0.6;
      const coachEarnings = amountDecimal.mul(new Decimal(coachCommissionRate));

      await tx.coachSession.update({
        where: { id: sessionId },
        data: {
          coachCompletedAt: new Date(),
          status: 'completed',
          price: amountDecimal.toNumber(),
          durationMinutes,
        },
      });

      const sessionPayment = await tx.sessionPayment.create({
        data: {
          sessionId,
          organizationId,
          playerId: primaryBooking.playerId,
          coachId,
          playerTier: playerTier || 'standard',
          amount: amountDecimal,
          durationMinutes,
          durationHours,
          pricePerHour: new Decimal(pricingRule.pricePerHour),
          pricingRuleType: pricingRule.ruleType,
          tierPriceId: pricingRule.tierPriceId,
          coachPriceId: pricingRule.coachPriceId,
          coachEarnings,
          coachCommissionRate: new Decimal(coachCommissionRate),
          status: 'pending',
        },
      });

      let userDebt = await tx.userOrgDebt.upsert({
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

      await tx.debtTransaction.create({
        data: {
          debtId: userDebt.id,
          transactionType: 'charge',
          amount: amountDecimal,
          description: `Coaching session on ${session.startTime.toLocaleDateString()} (${pricingRule.source})`,
          referenceType: 'session_payment',
          referenceId: sessionPayment.id,
        },
      });

      const coachEarning = await tx.coachEarning.create({
        data: {
          sessionId,
          coachId,
          organizationId,
          sessionPrice: amountDecimal,
          coachPercentage: new Decimal(coachCommissionRate),
          amount: coachEarnings,
          status: 'pending',
        },
      });

      const coachWallet = await tx.coachWallet.upsert({
        where: { coachId },
        create: {
          coachId,
          balance: coachEarnings.toNumber(),
          totalEarned: coachEarnings.toNumber(),
          pendingBalance: coachEarnings.toNumber(),
        },
        update: {
          totalEarned: { increment: coachEarnings.toNumber() },
          pendingBalance: { increment: coachEarnings.toNumber() },
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: coachWallet.id,
          type: 'credit',
          amount: coachEarnings.toNumber(),
          description: `Session earnings from ${session.title}`,
          reference: sessionPayment.id,
          balanceBefore: coachWallet.pendingBalance - coachEarnings.toNumber(),
          balanceAfter: coachWallet.pendingBalance,
        },
      });

      return { sessionPayment, userDebt, coachEarning, coachWallet };
    });
  }

  /**
   * Player confirms/marks session as complete
   * This validates attendance
   */
  async confirmPlayerSessionComplete(input: ConfirmPlayerSessionInput): Promise<any> {
    const { sessionId, playerId, attendanceStatus } = input;

    return await prisma.$transaction(async (tx) => {
      // Get session booking
      const booking = await tx.sessionBooking.findUnique({
        where: {
          sessionId_playerId: {
            sessionId,
            playerId,
          },
        },
      });

      if (!booking) {
        throw new Error(`Player ${playerId} is not booked for session ${sessionId}`);
      }

      // Update booking with player confirmation
      const updatedBooking = await tx.sessionBooking.update({
        where: { id: booking.id },
        data: {
          playerConfirmedAt: new Date(),
          attendanceStatus,
          status: 'completed',
        },
      });

      // If player was absent, handle refund/adjustment
      if (attendanceStatus === 'absent') {
        const sessionPayment = await tx.sessionPayment.findUnique({
          where: { sessionId },
        });

        if (sessionPayment) {
          // Create refund transaction
          const userDebt = await tx.userOrgDebt.findUnique({
            where: {
              userId_organizationId: {
                userId: playerId,
                organizationId: sessionPayment.organizationId,
              },
            },
          });

          if (userDebt) {
            await tx.userOrgDebt.update({
              where: { id: userDebt.id },
              data: {
                totalAmount: {
                  decrement: sessionPayment.amount,
                },
                outstandingAmount: {
                  decrement: sessionPayment.amount,
                },
              },
            });

            await tx.debtTransaction.create({
              data: {
                debtId: userDebt.id,
                transactionType: 'refund',
                amount: sessionPayment.amount,
                description: `Refund for absent session on ${new Date().toLocaleDateString()}`,
                referenceType: 'session_payment',
                referenceId: sessionPayment.id,
              },
            });
          }
        }
      }

      return updatedBooking;
    });
  }

  /**
   * Get session payment details including debt information
   */
  async getSessionPaymentDetails(sessionId: string): Promise<any> {
    const sessionPayment = await prisma.sessionPayment.findUnique({
      where: { sessionId },
      include: {
        session: true,
        organization: true,
      },
    });

    if (!sessionPayment) {
      return null;
    }

    const userDebt = await prisma.userOrgDebt.findUnique({
      where: {
        userId_organizationId: {
          userId: sessionPayment.playerId,
          organizationId: sessionPayment.organizationId,
        },
      },
      include: {
        debtTransactions: true,
      },
    });

    const coachEarning = await prisma.coachEarning.findUnique({
      where: { sessionId },
    });

    return {
      sessionPayment,
      userDebt,
      coachEarning,
    };
  }

  /**
   * Get user's total debt to organization
   */
  async getUserOrgDebt(userId: string, organizationId: string): Promise<any> {
    return await prisma.userOrgDebt.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      include: {
        debtTransactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * Get coach wallet and earnings summary
   */
  async getCoachEarningsSummary(coachId: string): Promise<any> {
    const wallet = await prisma.coachWallet.findUnique({
      where: { coachId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    const recentEarnings = await prisma.coachEarning.findMany({
      where: { coachId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { session: true },
    });

    return {
      wallet,
      recentEarnings,
    };
  }

  /**
   * Configure organization coaching pricing
   */
  async configureOrgCoachingPrice(organizationId: string, pricePerHour: number): Promise<any> {
    return await prisma.orgCoachingPricing.upsert({
      where: { organizationId },
      create: {
        organizationId,
        pricePerHour,
        currency: 'USD',
        minSessionDurationMinutes: 30,
        roundingType: 'up',
      },
      update: { pricePerHour, updatedAt: new Date() },
    });
  }

  /**
   * Add or update tier-based pricing
   */
  async setTierPricing(
    organizationId: string,
    tierName: string,
    pricePerHour: number,
    discountPercent?: number,
    description?: string
  ): Promise<any> {
    const orgPricing = await prisma.orgCoachingPricing.findUnique({
      where: { organizationId },
    });

    if (!orgPricing) {
      throw new Error(`Coaching pricing not configured for organization ${organizationId}`);
    }

    return await prisma.tierCoachingPrice.upsert({
      where: { pricingId_tierName: { pricingId: orgPricing.id, tierName } },
      create: {
        pricingId: orgPricing.id,
        tierName,
        pricePerHour,
        discountPercent: discountPercent || 0,
        description,
        isActive: true,
      },
      update: {
        pricePerHour,
        discountPercent: discountPercent || undefined,
        description: description || undefined,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Add or update coach-specific pricing
   */
  async setCoachPricing(
    organizationId: string,
    coachId: string,
    pricePerHour: number,
    tierName?: string,
    description?: string,
    reason?: string
  ): Promise<any> {
    const orgPricing = await prisma.orgCoachingPricing.findUnique({
      where: { organizationId },
    });

    if (!orgPricing) {
      throw new Error(`Coaching pricing not configured for organization ${organizationId}`);
    }

    const coach = await prisma.staff.findUnique({
      where: { userId: coachId },
    });

    if (!coach) {
      throw new Error(`Coach ${coachId} not found`);
    }

    return await prisma.coachSpecificPrice.upsert({
      where: {
        pricingId_coachId_tierName: {
          pricingId: orgPricing.id,
          coachId,
          tierName: (tierName || null) as any,
        },
      },
      create: {
        pricingId: orgPricing.id,
        coachId,
        pricePerHour,
        tierName: tierName || null,
        description,
        reason,
        isActive: true,
      },
      update: {
        pricePerHour,
        description: description || undefined,
        reason: reason || undefined,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get all pricing rules for an organization
   */
  async getPricingRules(organizationId: string): Promise<any> {
    const orgPricing = await prisma.orgCoachingPricing.findUnique({
      where: { organizationId },
      include: {
        tierPrices: { where: { isActive: true } },
        coachPrices: {
          where: { isActive: true },
          include: {
            staff: {
              select: {
                userId: true,
                user: { select: { firstName: true, lastName: true, email: true } },
              },
            },
          },
        },
      },
    });

    return orgPricing;
  }

  /**
   * Deactivate a pricing rule
   */
  async deactivatePricingRule(ruleType: 'tier' | 'coach', ruleId: string): Promise<any> {
    if (ruleType === 'tier') {
      return await prisma.tierCoachingPrice.update({
        where: { id: ruleId },
        data: { isActive: false },
      });
    } else {
      return await prisma.coachSpecificPrice.update({
        where: { id: ruleId },
        data: { isActive: false },
      });
    }
  }
}

export const coachingSessionPaymentService = new CoachingSessionPaymentService();
