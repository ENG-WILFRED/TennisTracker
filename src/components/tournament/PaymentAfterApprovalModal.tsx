'use client';

import React, { useState } from 'react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

interface PaymentAfterApprovalModalProps {
  tournament: any;
  registration: any;
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentAfterApprovalModal({
  tournament,
  registration,
  user,
  onClose,
  onSuccess,
}: PaymentAfterApprovalModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'mobile'>('card');
  const [mobileNumber, setMobileNumber] = useState<string>(user?.phone || '');

  const entryFee = tournament.entryFee || 0;
  const total = entryFee;

  const handlePay = async () => {
    if (!user?.id) {
      setError('You must be logged in to complete payment.');
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
        eventId: tournament.id,
        registrationId: registration.id,
        mobileNumber: paymentMethod === 'mobile' ? mobileNumber : undefined,
        bookingType: 'tournament_entry',
        amount: total,
        accountReference: `TOURNAMENT-${tournament.name}-${Date.now()}`,
        transactionDesc: `Entry fee for ${tournament.name}`,
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
            metadata: { source: 'tournament_entry', registrationId: registration.id },
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
            currency: 'USD',
            origin: window.location.origin,
            metadata: { source: 'tournament_entry', registrationId: registration.id },
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(data.error || 'Stripe payment failed');
          return;
        }

        if (data.url) {
          setSuccessMessage('Redirecting to secure payment page...');
          setError(null);
          setTimeout(() => {
            window.location.href = data.url;
          }, 1500);
          return;
        }

        setError('Stripe payment could not be started');
        setSuccessMessage(null);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while processing payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: '#0a160a',
          border: '1px solid rgba(125,193,66,0.3)',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#c8f07a',
              margin: '0 0 8px 0',
              fontFamily: 'Syne, sans-serif',
            }}
          >
            Complete Payment
          </h2>
          <p
            style={{
              fontSize: '13px',
              color: '#8fa878',
              margin: 0,
            }}
          >
            Your application has been approved! Complete payment to confirm your spot.
          </p>
        </div>

        {/* Tournament Info */}
        <div
          style={{
            background: 'rgba(125,193,66,0.08)',
            border: '1px solid rgba(125,193,66,0.16)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <label
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '.08em',
                color: '#6a9058',
                textTransform: 'uppercase',
                display: 'block',
              }}
            >
              Tournament
            </label>
            <div style={{ fontSize: '14px', color: '#dff0d0', fontWeight: 500 }}>
              {tournament.name}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '.08em',
                  color: '#6a9058',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Entry Fee
              </label>
              <div style={{ fontSize: '14px', color: '#a8d84e', fontWeight: 600 }}>
                ${entryFee.toFixed(2)}
              </div>
            </div>
            <div>
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '.08em',
                  color: '#6a9058',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Total Amount
              </label>
              <div style={{ fontSize: '14px', color: '#c8f07a', fontWeight: 700 }}>
                ${total.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '.08em',
              color: '#6a9058',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '12px',
            }}
          >
            Payment Method
          </label>

          <div style={{ display: 'grid', gap: '8px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: paymentMethod === 'card' ? 'rgba(125,193,66,0.15)' : 'rgba(125,193,66,0.05)',
                border:
                  paymentMethod === 'card'
                    ? '1px solid rgba(125,193,66,0.3)'
                    : '1px solid rgba(125,193,66,0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={(e) => setPaymentMethod(e.target.value as 'card')}
                style={{ marginRight: '8px', cursor: 'pointer' }}
              />
              <span style={{ color: '#dff0d0', fontSize: '13px' }}>💳 Credit/Debit Card (Stripe)</span>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: paymentMethod === 'bank' ? 'rgba(125,193,66,0.15)' : 'rgba(125,193,66,0.05)',
                border:
                  paymentMethod === 'bank'
                    ? '1px solid rgba(125,193,66,0.3)'
                    : '1px solid rgba(125,193,66,0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="bank"
                checked={paymentMethod === 'bank'}
                onChange={(e) => setPaymentMethod(e.target.value as 'bank')}
                style={{ marginRight: '8px', cursor: 'pointer' }}
              />
              <span style={{ color: '#dff0d0', fontSize: '13px' }}>🏦 PayPal</span>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: paymentMethod === 'mobile' ? 'rgba(125,193,66,0.15)' : 'rgba(125,193,66,0.05)',
                border:
                  paymentMethod === 'mobile'
                    ? '1px solid rgba(125,193,66,0.3)'
                    : '1px solid rgba(125,193,66,0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="mobile"
                checked={paymentMethod === 'mobile'}
                onChange={(e) => setPaymentMethod(e.target.value as 'mobile')}
                style={{ marginRight: '8px', cursor: 'pointer' }}
              />
              <span style={{ color: '#dff0d0', fontSize: '13px' }}>📱 M-Pesa</span>
            </label>
          </div>
        </div>

        {/* Mobile Number Input (for M-Pesa) */}
        {paymentMethod === 'mobile' && (
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '.08em',
                color: '#6a9058',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Mobile Number
            </label>
            <input
              type="text"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="254XXXXXXXXX"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(125,193,66,0.05)',
                border: '1px solid rgba(125,193,66,0.2)',
                borderRadius: '8px',
                color: '#dff0d0',
                fontSize: '13px',
                fontFamily: 'inherit',
              }}
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: 'rgba(255, 60, 60, 0.1)',
              border: '1px solid rgba(255, 60, 60, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#ff6b6b',
            }}
          >
            {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div
            style={{
              backgroundColor: 'rgba(125, 193, 66, 0.1)',
              border: '1px solid rgba(125, 193, 66, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#a8d84e',
            }}
          >
            {successMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'rgba(125,193,66,0.08)',
              color: '#c8f07a',
              border: '1px solid rgba(125,193,66,0.3)',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              opacity: loading ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handlePay}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'linear-gradient(135deg,#5aa820,#7dc142,#a8d84e)',
              color: '#0a160a',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Processing...' : `Pay $${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
