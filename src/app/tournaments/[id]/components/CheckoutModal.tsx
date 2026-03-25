import React, { useState } from 'react';
import { Tournament } from './types';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

export function CheckoutModal({ t, user, onClose, onSuccess }: { t: Tournament; user: any; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'mobile'>('card');
  const [mobileNumber, setMobileNumber] = useState<string>(user?.phone || '');

  const handlePay = async () => {
    setSuccessMessage(null); if (!user?.id) {
      setError('You must be logged in to register.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      // Validate mobile number for M-Pesa
      if (paymentMethod === 'mobile') {
        if (!mobileNumber || !mobileNumber.match(/^254\d{9}$/)) {
          setError('Invalid mobile number. Please use format: 254XXXXXXXXX');
          setLoading(false);
          return;
        }
      }

      const payload = {
        userId: user.id,
        eventId: t.id,
        mobileNumber: paymentMethod === 'mobile' ? mobileNumber : undefined,
        bookingType: 'tournament_entry',
        amount: total,
        accountReference: `TOURNAMENT-${t.name}-${Date.now()}`,
        transactionDesc: `Entry fee for ${t.name}`,
      };

      if (paymentMethod === 'mobile') {
        const response = await authenticatedFetch('/api/payments/mpesa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(data.error || 'M-Pesa payment failed');
          setSuccessMessage(null);
          return;
        }

        // Pending confirmation from M-Pesa callback
        setSuccessMessage('M-Pesa STK push initiated. Complete payment on your phone.');
        setError(null);
        return;
      }

      if (paymentMethod === 'bank') {
        const response = await authenticatedFetch('/api/payments/paypal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            currency: 'USD',
            metadata: { source: 'tournament_entry' },
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(data.error || 'PayPal payment failed');
          return;
        }

        if (data.links && Array.isArray(data.links)) {
          const approveLink = data.links.find((link: any) => link.rel === 'approve');
          if (approveLink && approveLink.href) {
            setSuccessMessage('PayPal checkout initiated. Redirecting to payment provider...');
            setError(null);
            // Small delay to show the success message before redirect
            setTimeout(() => {
              window.location.href = approveLink.href;
            }, 1500);
            return;
          }
        }

        setError('PayPal payment could not be started - no approval link found');
        setSuccessMessage(null);
        return;
      }

      if (paymentMethod === 'card') {
        const response = await authenticatedFetch('/api/payments/stripe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            currency: 'usd',
            metadata: { source: 'tournament_entry' },
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(data.error || 'Stripe payment failed');
          return;
        }

        if (data.checkoutUrl) {
          setSuccessMessage('Stripe checkout initiated. Redirecting to payment provider...');
          setError(null);
          window.location.href = data.checkoutUrl;
          return;
        }

        setError('Stripe payment could not be started');
        setSuccessMessage(null);
        return;
      }

      setError('Unsupported payment method.');
    } catch (err: any) {
      setError(err?.message || 'Error processing payment');
      setSuccessMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const total = t.entryFee || 0;

  return (
    <div className="fixed inset-0 bg-[rgba(2,7,3,0.85)] backdrop-blur-lg z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0a1510] border border-[rgba(99,153,34,0.2)] rounded-[18px] w-full max-w-[480px] overflow-hidden animate-[modalIn_0.2s_ease]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-[rgba(99,153,34,0.16)]">
          <div className="text-3xl mb-2">🎾</div>
          <h3 className="text-lg font-semibold text-[#e8f8d8] mb-1">Registration Checkout</h3>
          <p className="text-sm text-[#5a7242] truncate">{t.name}</p>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Order Summary */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#4a6335] mb-2">Order summary</p>
            <div className="bg-[rgba(99,153,34,0.06)] border border-[rgba(99,153,34,0.15)] rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm text-[#dde8d4]">
                <span>{t.name}</span>
                <span className="font-semibold text-[#c8e0a8]">${total}</span>
              </div>
              <div className="flex justify-between text-sm text-[#a3d45e]">
                <span>Processing fee</span>
                <span className="font-semibold">Free</span>
              </div>
              <div className="border-t border-[rgba(99,153,34,0.15)] pt-2 flex justify-between font-bold text-sm text-[#e6f2d2]">
                <span>Total due</span>
                <span>${total}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#4a6335] mb-2">Payment method</p>
            <div className="grid grid-cols-1 gap-2">
              {[{ key: 'card', label: '💳 Credit / Debit Card' }, { key: 'bank', label: '🏦 Bank Transfer' }, { key: 'mobile', label: '📱 Mobile Money (M-Pesa)' }].map((option) => (
                <label key={option.key} className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors ${paymentMethod === option.key ? 'border-[#8dc843] bg-[rgba(99,153,34,0.12)]' : 'border-[rgba(99,153,34,0.12)] bg-transparent hover:border-[rgba(99,153,34,0.25)]'}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={option.key}
                    checked={paymentMethod === option.key}
                    onChange={() => setPaymentMethod(option.key as 'card' | 'bank' | 'mobile')}
                    className="accent-[#8dc843]"
                  />
                  <span className="text-sm text-[#dde8d4]">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Mobile Number Input (shown when Mobile Money selected) */}
          {paymentMethod === 'mobile' && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#4a6335] mb-2 block">
                Mobile Number
              </label>
              <input
                type="tel"
                placeholder="254XXXXXXXXX"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full bg-[rgba(99,153,34,0.08)] border border-[rgba(99,153,34,0.2)] rounded-lg px-3 py-2 text-[#dde8d4] placeholder-[#5a7242] focus:outline-none focus:border-[#8dc843] text-sm"
              />
              <p className="text-xs text-[#5a7242] mt-1">
                Format: 254XXXXXXXXX (Kenya)
              </p>
            </div>
          )}

          {/* Status Message */}
          {error && (
            <div className="text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded-md p-3">
              ⚠️ {error}
            </div>
          )}
          {successMessage && (
            <div className="text-sm text-emerald-300 bg-emerald-900/20 border border-emerald-800/30 rounded-md p-3">
              ✅ {successMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-[rgba(99,153,34,0.15)]">
          <button
            className="btn btn-md btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
            onClick={handlePay}
          >
            {loading ? '⏳ Processing…' : `✓ Confirm & Pay (${paymentMethod.toUpperCase()})`}
          </button>
          <button className="btn btn-md btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}