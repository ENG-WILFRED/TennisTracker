'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createCourtBooking, getPaymentStatus } from '@/actions/payments';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040', red: '#dc2626',
};

export default function PaymentSuccessPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<'checking' | 'success' | 'failed'>('checking');
  const [message, setMessage] = useState('');
  const [bookingId, setBookingId] = useState<string>('');

  const transactionId = params.get('transactionId') || params.get('token') || params.get('session_id');
  const source = params.get('source') || (params.get('token') ? 'paypal' : params.get('session_id') ? 'stripe' : null);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!transactionId) {
        setStatus('failed');
        setMessage('Missing transaction ID');
        return;
      }

      try {
        // Check payment status from our API
        const result = await getPaymentStatus(transactionId);

        if (!result.success) {
          setStatus('failed');
          setMessage('Payment verification failed');
          return;
        }

        if (result.isCompleted) {
          // Payment was already completed
          setStatus('success');
          setMessage('✓ Payment successful! Your booking has been confirmed.');
          setBookingId(transactionId);

          // Redirect to dashboard in 3 seconds
          setTimeout(() => {
            router.push(`/dashboard/player/`);
          }, 3000);
        } else {
          // Payment is pending (still processing)
          setStatus('checking');
          setMessage('Payment is being processed... Please wait.');

          // Poll for completion (max 60 seconds)
          let attempts = 0;
          const pollInterval = setInterval(async () => {
            attempts++;
            const pollResult = await getPaymentStatus(transactionId);

            if (pollResult.isCompleted || attempts > 30) {
              clearInterval(pollInterval);
              if (pollResult.isCompleted) {
                setStatus('success');
                setMessage('✓ Payment successful! Your booking has been confirmed.');
                setTimeout(() => {
                  router.push(`/dashboard/player/`);
                }, 3000);
              } else {
                setStatus('failed');
                setMessage('Payment confirmation timeout. Please check your email for booking status.');
              }
            }
          }, 2000); // Poll every 2 seconds
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('failed');
        setMessage(error instanceof Error ? error.message : 'An error occurred while verifying payment');
      }
    };

    verifyPayment();
  }, [transactionId, router]);

  return (
    <div className="w-full min-h-screen p-4 md:p-6 flex items-center justify-center" style={{ backgroundColor: G.dark, color: G.text }}>
      <div className="w-full max-w-md">
        {status === 'checking' && (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full" style={{ backgroundColor: G.sidebar }}>
              <div className="w-10 h-10 border-4 border-transparent rounded-full animate-spin" style={{ borderTopColor: G.lime }}></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: G.lime }}>Processing Payment</h1>
              <p style={{ color: G.muted }}>{message}</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full" style={{ backgroundColor: `${G.lime}20` }}>
              <span className="text-4xl">✓</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: G.lime }}>Payment Successful</h1>
              <p style={{ color: G.muted }} className="mb-4">{message}</p>
              <p className="text-sm" style={{ color: G.muted }}>
                Redirecting to your dashboard in a moment...
              </p>
            </div>
            <div className="pt-4 border-t" style={{ borderColor: G.cardBorder }}>
              <button
                onClick={() => router.push(`/dashboard/player/`)}
                className="w-full py-3 rounded-lg font-bold transition-all"
                style={{
                  backgroundColor: G.lime,
                  color: G.dark,
                }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full" style={{ backgroundColor: `${G.red}20` }}>
              <span className="text-4xl">✕</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: G.red }}>Payment Failed</h1>
              <p style={{ color: G.muted }} className="mb-4">{message}</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => router.back()}
                className="w-full py-3 rounded-lg font-bold transition-all"
                style={{
                  backgroundColor: G.lime,
                  color: G.dark,
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => router.push(`/dashboard/player/`)}
                className="w-full py-3 rounded-lg font-bold border-2 transition-all"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: G.cardBorder,
                  color: G.text,
                }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
