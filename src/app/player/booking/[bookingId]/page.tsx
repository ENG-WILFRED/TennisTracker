'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cancelCourtBooking } from '@/actions/bookings';

const G = {
  dark: '#0f1f0f',
  sidebar: '#152515',
  card: '#1a3020',
  cardBorder: '#2d5a35',
  mid: '#2d5a27',
  bright: '#3d7a32',
  lime: '#7dc142',
  accent: '#a8d84e',
  text: '#e8f5e0',
  muted: '#7aaa6a',
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-xl p-4 border ${className}`} style={{ background: G.card, borderColor: G.cardBorder }}>
    {children}
  </div>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: G.accent }}>{children}</div>
);

export default function BookingDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const bookingId = params.bookingId as string;
  const orgId = searchParams.get('org');

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    // Mock: In a real app, you'd fetch the booking details from the database
    // For now, we'll show a placeholder
    setLoading(false);
  }, [bookingId]);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleCancel = async () => {
    if (!user?.id || !bookingId) return;
    
    if (confirm('Are you sure you want to cancel this booking?')) {
      try {
        await cancelCourtBooking(bookingId, user.id);
        showToast('success', 'Booking cancelled successfully');
        setTimeout(() => router.back(), 1500);
      } catch (error: any) {
        showToast('error', error.message || 'Failed to cancel booking');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: G.sidebar }}>
        <Card>
          <div className="text-center py-12">
            <div className="text-5xl animate-spin">⏳</div>
            <div className="text-sm mt-4" style={{ color: G.muted }}>Loading booking details…</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: G.sidebar, color: G.text }}>
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 font-semibold mb-4 transition-colors"
            style={{ color: G.lime }}
          >
            <span className="text-2xl">←</span> Back
          </button>
          <h1 className="text-4xl font-black mb-2" style={{ color: G.lime }}>Booking Details</h1>
          <p style={{ color: G.muted }}>Booking ID: <span className="font-mono font-semibold">{bookingId}</span></p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-6">
          
          {/* LEFT COLUMN */}
          <div>
            {/* Main Booking Info Card */}
            <Card className="mb-6">
              <Label>📅 Booking Information</Label>
              
              <div className="rounded-lg p-4 mb-4" style={{ background: G.mid }}>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: G.muted }}>Court</p>
                    <p className="text-2xl font-black" style={{ color: G.text }}>Court #1</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: G.muted }}>Status</p>
                    <div className="inline-block px-3 py-1 rounded-full text-sm font-bold" style={{ background: G.lime, color: G.dark }}>
                      ✓ Confirmed
                    </div>
                  </div>
                </div>
              </div>

              {/* Time and Details */}
              <div className="space-y-3 mb-4">
                {[
                  { label: 'Date', value: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }), icon: '📅' },
                  { label: 'Time', value: '10:00 AM - 11:00 AM', icon: '🕙' },
                  { label: 'Duration', value: '1 hour', icon: '⏱️' },
                  { label: 'Price', value: '$45.00', icon: '💵' },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between p-3 rounded-lg" style={{ background: G.mid }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{r.icon}</span>
                      <span className="font-semibold" style={{ color: G.lime }}>{r.label}</span>
                    </div>
                    <span className="font-bold" style={{ color: G.accent }}>{r.value}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button className="py-3 rounded-lg font-bold text-sm transition-all hover:opacity-90" style={{ background: G.bright, color: G.text }}>
                  📅 Reschedule
                </button>
                <button
                  onClick={handleCancel}
                  className="py-3 rounded-lg font-bold text-sm transition-all hover:opacity-90 border"
                  style={{ background: '#7a3a3a', color: '#ff6b6b', borderColor: '#a55050' }}
                >
                  ✕ Cancel Booking
                </button>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            {/* Important Information Card */}
            <Card className="mb-6">
              <Label>⚡ Important Information</Label>
              <div className="space-y-3">
                {[
                  { icon: '⏰', title: 'Cancellation Policy', text: 'Free cancellation up to 2 hours before your session' },
                  { icon: '🔔', title: 'Reminder', text: 'You will receive a reminder 24 hours before your booking' },
                  { icon: '📍', title: 'Check-in', text: 'Please arrive 10 minutes early for check-in' },
                  { icon: '👥', title: 'Player Limit', text: 'Maximum 2 players per court unless specified otherwise' },
                ].map(p => (
                  <div key={p.text} className="flex gap-3 p-3 rounded-lg transition-all" style={{ background: G.mid }}>
                    <span className="text-2xl">{p.icon}</span>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: G.accent }}>{p.title}</p>
                      <p className="text-sm mt-1" style={{ color: G.muted }}>{p.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Contact Support Card */}
            <Card>
              <Label>📞 Need Help?</Label>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: G.mid }}>
                <div>
                  <p className="font-semibold" style={{ color: G.accent }}>Contact Support</p>
                  <p className="text-sm mt-1" style={{ color: G.muted }}>We're here 24/7</p>
                </div>
                <button className="px-4 py-2 rounded-lg font-semibold text-sm transition-colors hover:opacity-90" style={{ background: G.lime, color: G.dark }}>
                  Contact
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl font-bold text-sm shadow-lg border transition-all`} style={{ background: toast.type === 'success' ? G.lime : '#d45555', color: toast.type === 'success' ? G.dark : G.text, borderColor: toast.type === 'success' ? G.accent : '#ff8080' }}>
          {toast.type === 'success' ? '✓ ' : '✕ '}{toast.message}
        </div>
      )}
    </div>
  );
}
