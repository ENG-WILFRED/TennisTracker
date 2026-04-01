'use client';

import React, { useState, useEffect } from 'react';
import { getMembershipTiers, calculateMembershipSavings, confirmMembershipPurchase } from '@/actions/membership';

interface MembershipOffer {
  id: string;
  name: string;
  description: string | null;
  monthlyPrice: number;
  benefits: string[];
  guestSurcharge: number;
  courtHoursPerMonth?: number | null;
  maxConcurrentBookings?: number | null;
  discountPercentage?: number | null;
  benefitsJson?: string | null;
  savings?: {
    monthlyMembershipCost: number;
    estimatedMonthlyGuestCost: number;
    estimatedSavings: number;
    totalSavingsYearly: number;
  };
}

interface BookingConfirmationProps {
  booking: any;
  playerId: string;
  organizationId: string;
  organization?: any; // Add org details
  isMember: boolean;
  membershipStatus: string;
  onClose?: () => void;
  onMembershipPurchased?: () => void;
}

type ConfirmationStep = 'booking-summary' | 'explore-org' | 'membership-tiers' | 'payment-review' | 'processing' | 'approval-pending' | 'welcome' | 'cancelled';

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  booking,
  playerId,
  organizationId,
  organization,
  isMember,
  membershipStatus,
  onClose,
  onMembershipPurchased,
}) => {
  const [step, setStep] = useState<ConfirmationStep>('booking-summary');
  const [tiers, setTiers] = useState<MembershipOffer[]>([]);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [loadingTiers, setLoadingTiers] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [tierSavings, setTierSavings] = useState<any>(null);
  const [orgAccepted, setOrgAccepted] = useState(false);

  // Load membership tiers if guest
  useEffect(() => {
    if (!isMember && organizationId) {
      loadMembershipTiers();
    }
  }, []);

  const loadMembershipTiers = async () => {
    setLoadingTiers(true);
    const tiersData = await getMembershipTiers(organizationId);
    setTiers(tiersData);
    if (tiersData.length > 0) {
      setSelectedTier(tiersData[0].id);
      calculateSavings(tiersData[0].id);
    }
    setLoadingTiers(false);
  };

  const calculateSavings = async (tierId: string) => {
    const savings = await calculateMembershipSavings(organizationId, tierId);
    setTierSavings(savings);
  };

  const handleTierChange = (tierId: string) => {
    setSelectedTier(tierId);
    calculateSavings(tierId);
  };

  const handleBuyMembership = async () => {
    if (!selectedTier) return;

    setProcessingPayment(true);
    try {
      const result = await confirmMembershipPurchase(
        playerId,
        organizationId,
        selectedTier,
        `BOOKING_${booking.id}`,
        'direct',
        booking.id // Pass booking ID to upgrade it
      );

      if (result.success) {
        setStep('approval-pending');
        // Simulate org approval after 2 seconds
        setTimeout(() => {
          setStep('welcome');
          onMembershipPurchased?.();
        }, 2000);
      } else {
        alert(`Error: ${result.error}`);
        setStep('booking-summary');
      }
    } catch (error: any) {
      alert(`Payment processing error: ${error.message}`);
      setStep('booking-summary');
    } finally {
      setProcessingPayment(false);
    }
  };

  const guestPrice = booking?.price || 150;
  const memberPrice = Math.round(guestPrice / 1.5);

  // ─── STEP 1: Booking Summary ─────────────────────────────────────────
  if (step === 'booking-summary' && !isMember) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#1a3020] border border-[#2d5a35] rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-[#a8d84e] mb-4">✓ Booking Confirmed!</h2>

          <div className="bg-[#0f1f17] rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p className="text-[#7a9b4d] text-xs uppercase tracking-wider">Court</p>
                <p className="text-white font-semibold">{booking?.court?.name}</p>
              </div>
              <div>
                <p className="text-[#7a9b4d] text-xs uppercase tracking-wider">Time</p>
                <p className="text-white font-semibold">
                  {new Date(booking?.startTime).toLocaleTimeString()}
                </p>
              </div>
              <div>
                <p className="text-[#7a9b4d] text-xs uppercase tracking-wider">Status</p>
                <p className="text-[#ff9999] font-semibold">Guest (50% surcharge)</p>
              </div>
              <div>
                <p className="text-[#7a9b4d] text-xs uppercase tracking-wider">Amount</p>
                <p className="text-[#ffb366] font-bold text-lg">Ksh {guestPrice}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#2d5a35]">
              <p className="text-[#ff9999] text-sm font-semibold mb-2">💰 You paid as a guest</p>
              <div className="text-[#7a9b4d] text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Member rate:</span>
                  <span className="text-[#a8d84e]">Ksh {memberPrice}</span>
                </div>
                <div className="flex justify-between text-[#ff9999]">
                  <span>Guest surcharge:</span>
                  <span>+Ksh {guestPrice - memberPrice}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep('explore-org')}
            className="w-full bg-[#a8d84e] text-[#0f1f17] font-bold py-2 px-4 rounded-lg hover:bg-[#b8e85e] transition-all mb-3"
          >
            💡 Join Membership to Save
          </button>

          <button
            onClick={onClose}
            className="w-full bg-transparent border border-[#2d5a35] text-[#7a9b4d] font-semibold py-2 px-4 rounded-lg hover:bg-[#0f1f17] transition-all"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // ─── STEP 2: Explore Organization ───────────────────────────────────
  if (step === 'explore-org' && !isMember) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#1a3020] border border-[#2d5a35] rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-[#a8d84e] mb-4">📍 About This Organization</h2>

          <div className="bg-[#0f1f17] rounded-lg p-4 mb-6 space-y-4">
            <div>
              <p className="text-[#7a9b4d] text-xs uppercase tracking-wider font-bold">Organization</p>
              <p className="text-white text-lg font-semibold mt-1">{organization?.name}</p>
              {organization?.description && (
                <p className="text-[#a8d84e] text-sm mt-2">{organization.description}</p>
              )}
            </div>

            {organization?.city && (
              <div>
                <p className="text-[#7a9b4d] text-xs uppercase tracking-wider font-bold">Location</p>
                <p className="text-white text-sm mt-1">
                  {organization.city}
                  {organization.country && `, ${organization.country}`}
                </p>
              </div>
            )}

            {organization?.phone && (
              <div>
                <p className="text-[#7a9b4d] text-xs uppercase tracking-wider font-bold">Contact</p>
                <p className="text-white text-sm mt-1">{organization.phone}</p>
              </div>
            )}

            <div className="pt-4 border-t border-[#2d5a35]">
              <p className="text-[#7a9b4d] text-xs uppercase tracking-wider font-bold mb-2">Membership Rules</p>
              <ul className="text-[#7a9b4d] text-sm space-y-2">
                <li>✓ Monthly membership (auto-renews)</li>
                <li>✓ Access to all courts</li>
                <li>✓ Member-only booking rates (50% discount)</li>
                <li>✓ Priority booking 7 days in advance</li>
                <li>✓ Cancel anytime before next billing cycle</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('membership-tiers')}
              className="flex-1 bg-[#a8d84e] text-[#0f1f17] font-bold py-2 px-4 rounded-lg hover:bg-[#b8e85e] transition-all"
            >
              Accept & Choose Tier
            </button>
            <button
              onClick={() => setStep('booking-summary')}
              className="flex-1 bg-transparent border border-[#2d5a35] text-[#7a9b4d] font-semibold py-2 px-4 rounded-lg hover:bg-[#0f1f17] transition-all"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP 3: Choose Membership Tier ─────────────────────────────────
  if (step === 'membership-tiers' && !isMember) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#1a3020] border border-[#2d5a35] rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-[#a8d84e] mb-4">🏆 Choose Your Membership</h2>

          {loadingTiers ? (
            <p className="text-[#7a9b4d]">Loading membership options...</p>
          ) : tiers.length === 0 ? (
            <p className="text-[#ff9999]">No membership tiers available</p>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {tiers.map((tier) => (
                  <div
                    key={tier.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTier === tier.id
                        ? 'border-[#a8d84e] bg-[#0f1f17]'
                        : 'border-[#2d5a35] hover:border-[#3d6b45]'
                    }`}
                    onClick={() => handleTierChange(tier.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-[#a8d84e]">{tier.name}</p>
                        {tier.description && (
                          <p className="text-[#7a9b4d] text-xs">{tier.description}</p>
                        )}
                      </div>
                      <p className="text-xl font-bold text-white">Ksh {tier.monthlyPrice}/mo</p>
                    </div>

                    {selectedTier === tier.id && tierSavings && (
                      <div className="mt-3 pt-3 border-t border-[#2d5a35]">
                        <p className="text-[#a8d84e] font-semibold text-sm">
                          💰 Save Ksh {Math.round(tierSavings.estimatedSavings)}/month
                        </p>
                        <p className="text-[#7a9b4d] text-xs">
                          Yearly savings: Ksh {Math.round(tierSavings.totalSavingsYearly)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('payment-review')}
                  className="flex-1 bg-[#a8d84e] text-[#0f1f17] font-bold py-2 px-4 rounded-lg hover:bg-[#b8e85e] transition-all"
                >
                  Next: Review Payment
                </button>
                <button
                  onClick={() => setStep('explore-org')}
                  className="flex-1 bg-transparent border border-[#2d5a35] text-[#7a9b4d] font-semibold py-2 px-4 rounded-lg hover:bg-[#0f1f17] transition-all"
                >
                  Back
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── STEP 4: Payment Review ─────────────────────────────────────────
  if (step === 'payment-review' && !isMember && selectedTier) {
    const selectedTierData = tiers.find((t) => t.id === selectedTier);
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#1a3020] border border-[#2d5a35] rounded-xl p-6 max-w-2xl w-full mx-4">
          <h2 className="text-2xl font-bold text-[#a8d84e] mb-6">💳 Confirm Payment</h2>

          <div className="bg-[#0f1f17] rounded-lg p-4 mb-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-[#7a9b4d]">Membership Tier:</span>
              <span className="text-white font-semibold">{selectedTierData?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7a9b4d]">Monthly Cost:</span>
              <span className="text-white font-semibold">Ksh {selectedTierData?.monthlyPrice}</span>
            </div>
            <div className="border-t border-[#2d5a35] pt-4 flex justify-between">
              <span className="text-[#a8d84e] font-bold">First Charge:</span>
              <span className="text-[#a8d84e] font-bold text-lg">Ksh {selectedTierData?.monthlyPrice}</span>
            </div>

            <div className="pt-4 border-t border-[#2d5a35] text-[#7a9b4d] text-xs space-y-1">
              <p>✓ Membership will be processed for approval by {organization?.name}</p>
              <p>✓ Typically approved within 1-2 hours</p>
              <p>✓ You'll receive a confirmation email</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleBuyMembership}
              disabled={processingPayment}
              className="flex-1 bg-[#a8d84e] text-[#0f1f17] font-bold py-2 px-4 rounded-lg hover:bg-[#b8e85e] disabled:opacity-50 transition-all"
            >
              {processingPayment ? '⏳ Processing...' : '✓ Confirm & Pay'}
            </button>
            <button
              onClick={() => setStep('membership-tiers')}
              disabled={processingPayment}
              className="flex-1 bg-transparent border border-[#2d5a35] text-[#7a9b4d] font-semibold py-2 px-4 rounded-lg hover:bg-[#0f1f17] transition-all disabled:opacity-50"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP 5: Approval Pending ───────────────────────────────────────
  if (step === 'approval-pending') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#1a3020] border border-[#2d5a35] rounded-xl p-6 max-w-2xl w-full mx-4 text-center">
          <div className="text-6xl mb-4 animate-bounce">⏳</div>
          <h2 className="text-2xl font-bold text-[#a8d84e] mb-2">Approval Pending</h2>
          <p className="text-[#7a9b4d] mb-6">
            Your membership is being reviewed by {organization?.name}
          </p>
          <p className="text-[#7a9b4d] text-sm">
            This typically takes 1-2 hours. You'll receive an email when approved.
          </p>
        </div>
      </div>
    );
  }

  // ─── STEP 6: Welcome ───────────────────────────────────────────────
  if (step === 'welcome') {
    const selectedTierData = tiers.find((t) => t.id === selectedTier);
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#1a3020] border border-[#2d5a35] rounded-xl p-6 max-w-2xl w-full mx-4 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-[#a8d84e] mb-2">Welcome!</h2>
          <p className="text-white text-lg font-semibold mb-2">
            You're now a {selectedTierData?.name} member
          </p>
          <div className="bg-[#0f1f17] rounded-lg p-4 mb-6">
            <p className="text-[#7a9b4d] text-sm mb-3">Your updated booking</p>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[#7a9b4d] text-xs uppercase">Court Booking</p>
                <p className="text-white font-semibold">{booking?.court?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[#7a9b4d] text-xs uppercase">Member Price</p>
                <p className="text-[#a8d84e] font-bold text-xl">Ksh {memberPrice}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#2d5a35]">
              <p className="text-[#a8d84e] text-sm">
                Saved Ksh {guestPrice - memberPrice} on this booking! 🎁
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-[#a8d84e] text-[#0f1f17] font-bold py-2 px-4 rounded-lg hover:bg-[#b8e85e] transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─── For Members: Just show confirmation ─────────────────────────────
  if (isMember) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#1a3020] border border-[#2d5a35] rounded-xl p-6 max-w-2xl w-full mx-4">
          <h2 className="text-2xl font-bold text-[#a8d84e] mb-4">✓ Booking Confirmed!</h2>

          <div className="bg-[#0f1f17] rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[#7a9b4d] text-xs uppercase tracking-wider">Court</p>
                <p className="text-white font-semibold">{booking?.court?.name}</p>
              </div>
              <div>
                <p className="text-[#7a9b4d] text-xs uppercase tracking-wider">Status</p>
                <p className="text-white font-semibold capitalize">Member</p>
              </div>
              <div>
                <p className="text-[#7a9b4d] text-xs uppercase tracking-wider">Price</p>
                <p className="text-[#a8d84e] font-bold text-lg">Ksh {booking?.price}</p>
              </div>
              <div>
                <p className="text-[#7a9b4d] text-xs uppercase tracking-wider">Time</p>
                <p className="text-white font-semibold">
                  {new Date(booking?.startTime).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-[#a8d84e] text-[#0f1f17] font-bold py-2 px-4 rounded-lg hover:bg-[#b8e85e] transition-all"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }
};

export default BookingConfirmation;
