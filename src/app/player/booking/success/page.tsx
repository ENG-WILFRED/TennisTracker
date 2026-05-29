'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040', red: '#dc2626',
};

export default function PaymentSuccessPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [redirecting, setRedirecting] = useState(true);

  const transactionId = params.get('transactionId') || params.get('token') || params.get('session_id');
  const bookingId = params.get('bookingId');

  useEffect(() => {
    if (!transactionId) {
      setRedirecting(false);
      return;
    }

    const queryParams = new URLSearchParams();
    queryParams.set('success', 'true');
    queryParams.set('transactionId', transactionId);

    if (bookingId) {
      queryParams.set('bookingId', bookingId);
    }

    router.replace(`/player/booking/details?${queryParams.toString()}`);
  }, [bookingId, router, transactionId]);

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[#0f1f0f] px-4 py-10" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="w-full max-w-xl rounded-3xl border border-[#2d5a35] bg-[#101e14] p-8 text-center text-[#e8f5e0] shadow-2xl">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#152515]">
          <div className="h-8 w-8 rounded-full border-4 border-transparent animate-spin" style={{ borderTopColor: G.lime }} />
        </div>
        <h1 className="text-3xl font-black mb-3" style={{ color: G.lime }}>Redirecting to booking details</h1>
        <p className="text-sm text-[#c9dfb8] mb-6">
          We found your payment transaction and are taking you to the updated booking confirmation experience.
        </p>
        {!transactionId && (
          <div className="rounded-3xl border border-[#c94d4d] bg-[#2b1215] p-5 text-sm text-[#f2b8b8]">
            <p className="font-semibold">No transaction was available.</p>
            <p className="mt-2">Please return to your bookings dashboard or try the payment again.</p>
            <button
              onClick={() => router.push('/dashboard/player/')}
              className="mt-4 rounded-full bg-[#7dc142] px-5 py-3 text-sm font-black text-[#081a08]"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
