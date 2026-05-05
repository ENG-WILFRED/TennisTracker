import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma client first
vi.mock('@/lib/prisma', () => ({
  default: {
    orgCoachingPricing: {
      findUnique: vi.fn(),
    },
    tierCoachingPrice: {
      findUnique: vi.fn(),
    },
    coachSpecificPrice: {
      findUnique: vi.fn(),
    },
    membership: {
      findUnique: vi.fn(),
    },
    sessionPayment: {
      create: vi.fn(),
      update: vi.fn(),
    },
    coachSession: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    userOrgDebt: {
      upsert: vi.fn(),
    },
    debtTransaction: {
      create: vi.fn(),
    },
  },
}));

import { coachingSessionPaymentService } from '../src/services/coaching-session-payment.service';
import prisma from '@/lib/prisma';

describe('Coaching Session Payment Service - Pricing Hierarchy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('determinePricingRule', () => {
    it('should return coach_tier pricing when coach has tier-specific rate', async () => {
      // Mock data
      const mockOrgPricing = {
        id: 'org-pricing-1',
        pricePerHour: 40,
        tierPrices: [],
        coachPrices: [],
      };

      const mockCoachTierPrice = {
        id: 'coach-tier-price-1',
        pricePerHour: 60,
        tierName: 'Premium',
        isActive: true,
        description: 'Premium coach for premium members',
      };

      // Mock Prisma calls
      (prisma.orgCoachingPricing.findUnique as any).mockResolvedValue(mockOrgPricing);
      (prisma.membership.findUnique as any).mockImplementation(async ({ where }: { where: any }) => {
        // Handle getPlayerTier call
        if (where.userId_orgId) {
          return { role: 'Premium', tier: 'Premium' };
        }
        return null;
      });
      (prisma.coachSpecificPrice.findUnique as any).mockImplementation(async ({ where }: { where: any }) => {
        // First call with tierName = 'Premium' returns the coach tier price
        if (where.pricingId_coachId_tierName?.tierName === 'Premium') {
          return mockCoachTierPrice;
        }
        // Other calls return null
        return null;
      });

      const result = await (coachingSessionPaymentService as any).determinePricingRule(
        'coach-1',
        'player-1',
        'org-1'
      );

      expect(result).toEqual({
        pricePerHour: 60,
        ruleType: 'coach_tier',
        coachPriceId: 'coach-tier-price-1',
        tierName: 'Premium',
        source: 'Coach specialty rate for Premium members',
      });
    });

    it('should return coach pricing when coach has org-wide rate', async () => {
      const mockOrgPricing = {
        id: 'org-pricing-1',
        pricePerHour: 40,
        tierPrices: [],
        coachPrices: [],
      };

      const mockCoachPrice = {
        id: 'coach-price-1',
        pricePerHour: 55,
        tierName: null, // Org-wide rate
        isActive: true,
        description: 'Experienced coach',
      };

      (prisma.orgCoachingPricing.findUnique as any).mockResolvedValue(mockOrgPricing);
      (prisma.membership.findUnique as any).mockResolvedValue({ tier: 'Standard' });
      (prisma.coachSpecificPrice.findUnique as any).mockImplementation(async ({ where }: { where: any }) => {
        // First call with tierName = 'Standard' returns null
        if (where.pricingId_coachId_tierName.tierName === 'Standard') {
          return null;
        }
        // Second call with tierName = null returns the coach price
        if (where.pricingId_coachId_tierName.tierName === null) {
          return mockCoachPrice;
        }
        return null;
      });
      (prisma.tierCoachingPrice.findUnique as any).mockResolvedValue(null);

      const result = await (coachingSessionPaymentService as any).determinePricingRule(
        'coach-1',
        'player-1',
        'org-1'
      );

      expect(result).toEqual({
        pricePerHour: 55,
        ruleType: 'coach',
        coachPriceId: 'coach-price-1',
        source: 'Experienced coach',
      });
    });

    it('should return tier pricing when player has special tier rate', async () => {
      const mockOrgPricing = {
        id: 'org-pricing-1',
        pricePerHour: 40,
        tierPrices: [],
        coachPrices: [],
      };

      const mockTierPrice = {
        id: 'tier-price-1',
        pricePerHour: 45,
        discountPercent: 0,
        isActive: true,
        description: 'Premium member discount',
      };

      (prisma.orgCoachingPricing.findUnique as any).mockResolvedValue(mockOrgPricing);
      (prisma.membership.findUnique as any).mockImplementation(async ({ where }: { where: any }) => {
        // Handle getPlayerTier call
        if (where.userId_orgId) {
          return { role: 'Premium', tier: 'Premium' };
        }
        return null;
      });
      (prisma.coachSpecificPrice.findUnique as any).mockResolvedValue(null);
      (prisma.tierCoachingPrice.findUnique as any).mockResolvedValue(mockTierPrice);

      const result = await (coachingSessionPaymentService as any).determinePricingRule(
        'coach-1',
        'player-1',
        'org-1'
      );

      expect(result).toEqual({
        pricePerHour: 45,
        ruleType: 'tier',
        tierPriceId: 'tier-price-1',
        tierName: 'Premium',
        source: 'Premium member pricing',
      });
    });

    it('should return base pricing when no special rules apply', async () => {
      const mockOrgPricing = {
        id: 'org-pricing-1',
        pricePerHour: 40,
        tierPrices: [],
        coachPrices: [],
      };

      (prisma.orgCoachingPricing.findUnique as any).mockResolvedValue(mockOrgPricing);
      (prisma.membership.findUnique as any).mockResolvedValue({ tier: 'Standard' });
      (prisma.coachSpecificPrice.findUnique as any).mockResolvedValue(null);
      (prisma.tierCoachingPrice.findUnique as any).mockResolvedValue(null);

      const result = await (coachingSessionPaymentService as any).determinePricingRule(
        'coach-1',
        'player-1',
        'org-1'
      );

      expect(result).toEqual({
        pricePerHour: 40,
        ruleType: 'base',
        source: 'Standard organization rate',
      });
    });
  });

  describe('calculateDurationHours', () => {
    it('should round up duration to nearest 15 minutes', () => {
      const service = coachingSessionPaymentService as any;

      // 30 minutes = 0.5 hours
      const start1 = new Date('2024-01-01T10:00:00');
      const end1 = new Date('2024-01-01T10:30:00');
      expect(service.calculateDurationHours(start1, end1, 'up').toNumber()).toBe(0.5);

      // 45 minutes = 0.75 hours
      const start2 = new Date('2024-01-01T10:00:00');
      const end2 = new Date('2024-01-01T10:45:00');
      expect(service.calculateDurationHours(start2, end2, 'up').toNumber()).toBe(0.75);

      // 90 minutes = 1.5 hours
      const start3 = new Date('2024-01-01T10:00:00');
      const end3 = new Date('2024-01-01T11:30:00');
      expect(service.calculateDurationHours(start3, end3, 'up').toNumber()).toBe(1.5);
    });

    it('should handle rounding types', () => {
      const service = coachingSessionPaymentService as any;

      // Test 'up' rounding (default)
      const start1 = new Date('2024-01-01T10:00:00');
      const end1 = new Date('2024-01-01T10:31:00'); // 31 minutes
      expect(service.calculateDurationHours(start1, end1, 'up').toNumber()).toBe(0.75); // rounds up to 0.75 hours (31/60 = 0.5167, rounds up to 0.75)

      const start2 = new Date('2024-01-01T10:00:00');
      const end2 = new Date('2024-01-01T10:46:00'); // 46 minutes
      expect(service.calculateDurationHours(start2, end2, 'up').toNumber()).toBe(1.0); // rounds up to 1.0 hours (60 minutes)

      // Test 'down' rounding
      expect(service.calculateDurationHours(start1, end1, 'down').toNumber()).toBe(0.5); // rounds down to 0.5 hours
      expect(service.calculateDurationHours(start2, end2, 'down').toNumber()).toBe(0.75); // rounds down to 0.75 hours

      // Test 'nearest' rounding
      const start3 = new Date('2024-01-01T10:00:00');
      const end3 = new Date('2024-01-01T10:37:00'); // 37 minutes
      expect(service.calculateDurationHours(start3, end3, 'nearest').toNumber()).toBe(0.5); // rounds to 0.5 hours

      const start4 = new Date('2024-01-01T10:00:00');
      const end4 = new Date('2024-01-01T10:38:00'); // 38 minutes
      expect(service.calculateDurationHours(start4, end4, 'nearest').toNumber()).toBe(0.75); // rounds to 0.75 hours
    });
  });
});