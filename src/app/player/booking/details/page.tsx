'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getAvailableTimeSlots } from '@/actions/bookings';
import { processMPesaPayment, processPayPalPayment, processStripePayment } from '@/actions/payments';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040', red: '#dc2626',
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-xl p-5 transition-all border ${className}`} style={{ backgroundColor: G.card, borderColor: G.cardBorder }}>
    {children}
  </div>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: G.accent }}>
    {children}
  </div>
);

const POPULAR_TIMES = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const POPULARITY = [2, 4, 7, 9, 6, 4, 5, 6, 7, 8, 9, 10, 9, 8, 6, 3];

const PopularityBar: React.FC<{ hour: number; value: number; max: number; selected?: boolean }> = ({ hour, value, max, selected }) => {
  const pct = Math.round((value / max) * 100);
  const color = pct >= 80 ? 'bg-red-500/70' : pct >= 50 ? 'bg-[#f0c040]/70' : 'bg-[#7dc142]/70';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-4 rounded-t overflow-hidden" style={{ height: 36, backgroundColor: G.sidebar }}>
        <div className={`w-full rounded-t transition-all ${color} ${selected ? 'ring-1 ring-white' : ''}`} style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }} />
      </div>
      <span className="text-[8px]" style={{ color: G.muted }}>{hour}</span>
    </div>
  );
};

function BookingDetailsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const courtId = params.get('court');
  const orgId = params.get('org');
  const matchType = params.get('type') || 'singles';

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [duration, setDuration] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [courtName, setCourtName] = useState<string>('Loading...');
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'stripe' | 'mpesa' | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string>('');
  const [paymentSuccess, setPaymentSuccess] = useState<string>('');

  // Fetch court details
  useEffect(() => {
    const fetchCourtName = async () => {
      if (!courtId) return;
      try {
        const res = await fetch(`/api/courts/${courtId}/details`);
        if (res.ok) {
          const data = await res.json();
          // API returns { court: {..., name: "..." }, stats: {...}, comments: [...] }
          const courtData = data.court || data;
          setCourtName(courtData.name || `Court ${courtData.id}`);
        } else {
          setCourtName(`Court ${courtId}`);
        }
      } catch (error) {
        console.error('Failed to fetch court name', error);
        setCourtName(`Court ${courtId}`);
      }
    };
    fetchCourtName();
  }, [courtId]);

  // Fetch time slots
  useEffect(() => {
    const loadSlots = async () => {
      if (!courtId || !orgId || !selectedDate) return;
      setLoading(true);
      try {
        const slots = await getAvailableTimeSlots(courtId, selectedDate, orgId);
        setTimeSlots(slots);
      } catch (error) {
        console.error('Failed to load time slots', error);
      } finally {
        setLoading(false);
      }
    };
    loadSlots();
  }, [courtId, orgId, selectedDate]);

  const handlePayment = async () => {
    if (!paymentMethod || !user || !courtId || !orgId) {
      setPaymentError('Please select a payment method and ensure all details are set');
      return;
    }

    if (paymentMethod === 'mpesa' && !mobileNumber) {
      setPaymentError('Please enter your M-Pesa number');
      return;
    }

    setProcessing(true);
    setPaymentError('');
    setPaymentSuccess('');
    
    try {
      const [hours, minutes] = selectedSlot.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + duration);

      // Process payment using server actions (creates payment record + gets checkout URL)
      let paymentResult: any = {};

      if (paymentMethod === 'mpesa') {
        paymentResult = await processMPesaPayment(
          mobileNumber,
          totalPrice,
          `BOOKING-${courtId.slice(0, 8)}`,
          'Court Booking Payment',
          user.id,
          courtId, // Use courtId as eventId for payment record
          'court_booking'
        );
      } else if (paymentMethod === 'paypal') {
        paymentResult = await processPayPalPayment(
          totalPrice,
          'usd',
          user.id,
          courtId,
          'court_booking',
          { courtId, organizationId: orgId, startTime: startTime.toISOString(), endTime: endTime.toISOString(), matchType }
        );
      } else if (paymentMethod === 'stripe') {
        paymentResult = await processStripePayment(
          totalPrice,
          'usd',
          user.id,
          courtId,
          'court_booking',
          { courtId, organizationId: orgId, startTime: startTime.toISOString(), endTime: endTime.toISOString(), matchType }
        );
      }

      if (!paymentResult.success) {
        setPaymentError(paymentResult.error || 'Payment processing failed');
        setProcessing(false);
        return;
      }

      if (paymentMethod === 'mpesa') {
        setPaymentSuccess('📱 STK push sent! Enter your PIN on your phone');
        setTimeout(() => {
          router.push(`/dashboard/player/${user.id}?tab=myBookings`);
        }, 2000);
        return;
      } 
      
      if (paymentMethod === 'paypal') {
        // PayPal - check for approval link in links array or checkoutUrl
        let checkoutUrl = null;
        if (paymentResult.links && Array.isArray(paymentResult.links)) {
          const approveLink = paymentResult.links.find((link: any) => link.rel === 'approve');
          checkoutUrl = approveLink?.href;
        } else if (paymentResult.checkoutUrl) {
          checkoutUrl = paymentResult.checkoutUrl;
        }

        if (!checkoutUrl) {
          setPaymentError('PayPal payment could not be started - no checkout URL provided');
          setProcessing(false);
          return;
        }
        
        setPaymentSuccess('PayPal checkout initiated. Redirecting to payment provider...');
        setProcessing(false);
        setTimeout(() => {
          window.location.href = checkoutUrl;
        }, 1500);
        return;
      }
      
      if (paymentMethod === 'stripe') {
        // Stripe - should return checkoutUrl
        if (!paymentResult.checkoutUrl) {
          setPaymentError('Stripe payment could not be started - no checkout URL provided');
          setProcessing(false);
          return;
        }
        
        setPaymentSuccess('Stripe checkout initiated. Redirecting to secure payment page...');
        setProcessing(false);
        setTimeout(() => {
          window.location.href = paymentResult.checkoutUrl;
        }, 1500);
        return;
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentError(error instanceof Error ? error.message : 'Payment processing failed');
      setProcessing(false);
    }
  };

  const totalPrice = 45 * duration;

  return (
    <div className="w-full min-h-screen p-4 md:p-6" style={{ backgroundColor: G.dark, color: G.text }}>
      <div className="mx-auto">
        {/* Header/Title Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="text-lg transition-colors hover:opacity-80"
              style={{ color: G.lime }}
            >
              ← Back
            </button>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2" style={{ color: G.lime }}>
            🎾 Complete Your Booking
          </h1>
          <p className="text-sm" style={{ color: G.muted }}>
            {courtName} • <span className="capitalize">{matchType}</span> • {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Main Layout: Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Booking Form (2 columns on large screens) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Date Selection */}
            <Card className="border">
              <Label>Select Date</Label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => {
                  // Only update if a valid date is selected
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                  }
                }}
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors"
                style={{
                  backgroundColor: G.sidebar,
                  borderColor: G.cardBorder,
                  color: G.text,
                }}
                onFocus={(e) => e.target.style.borderColor = G.lime}
                onBlur={(e) => e.target.style.borderColor = G.cardBorder}
              />
            </Card>

            {/* Peak Hours Chart */}
            <Card className="border">
              <Label>Peak Hours This Day</Label>
              <div className="flex items-end gap-2 justify-between px-2 py-4" style={{ backgroundColor: G.sidebar, borderRadius: '8px' }}>
                {POPULAR_TIMES.map((h, i) => (
                  <PopularityBar
                    key={h}
                    hour={h}
                    value={POPULARITY[i]}
                    max={Math.max(...POPULARITY)}
                    selected={selectedSlot?.startsWith(`${String(h).padStart(2, '0')}`)}
                  />
                ))}
              </div>
              <div className="flex gap-4 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded" style={{ backgroundColor: G.lime }}></span>
                  <span style={{ color: G.muted }}>Low</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded" style={{ backgroundColor: G.yellow }}></span>
                  <span style={{ color: G.muted }}>Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded" style={{ backgroundColor: G.red }}></span>
                  <span style={{ color: G.muted }}>High</span>
                </div>
              </div>
            </Card>

            {/* Time Slots */}
            <Card className="border">
              <Label>Available Time Slots</Label>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block text-2xl mb-2">⏳</div>
                  <p style={{ color: G.muted }} className="text-sm">Loading available times...</p>
                </div>
              ) : timeSlots.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-block text-2xl mb-2">📭</div>
                  <p style={{ color: G.muted }} className="text-sm">No slots available for this date</p>
                </div>
              ) : (
                <div className="grid grid-cols-6 md:grid-cols-8 gap-2">
                  {timeSlots.map(slot => (
                    <div key={slot.hour} className="relative group">
                      <button
                        onClick={() => {
                          // Only allow selection if slot is available
                          if (slot.available) {
                            setSelectedSlot(slot.time);
                          }
                        }}
                        disabled={!slot.available}
                        className={`flex flex-col items-center py-3 px-2 rounded-lg border-2 transition-all text-xs font-bold w-full ${
                          !slot.available ? 'cursor-not-allowed opacity-50' : ''
                        }`}
                        style={{
                          backgroundColor: selectedSlot === slot.time && slot.available ? G.lime : slot.available ? G.sidebar : '#3a2d2d',
                          borderColor: selectedSlot === slot.time && slot.available ? G.lime : slot.available ? G.cardBorder : '#5a2d2d',
                          color: selectedSlot === slot.time && slot.available ? G.dark : slot.available ? G.text : G.muted,
                        }}
                        title={!slot.available && slot.pendingCount > 0 ? `${slot.pendingCount} pending booking(s) - will notify if available` : !slot.available ? 'Fully booked' : undefined}
                      >
                        <span className="font-semibold">{slot.time}</span>
                        <span className="text-[9px] mt-1" style={{ opacity: 0.8 }}>
                          ${slot.price}
                        </span>
                        {/* Pending count badge */}
                        {slot.pendingCount > 0 && (
                          <span 
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                            style={{ backgroundColor: '#f0c040', color: '#000' }}
                          >
                            {slot.pendingCount}
                          </span>
                        )}
                      </button>
                      {/* Hover tooltip for pending slots */}
                      {slot.pendingCount > 0 && !slot.available && (
                        <div 
                          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                          style={{ backgroundColor: '#f0c040', color: '#000' }}
                        >
                          <div className="font-bold">Pending Confirmation</div>
                          <div>{slot.pendingCount} {slot.pendingCount === 1 ? 'person' : 'people'} waiting</div>
                          <div className="text-[10px] mt-1">We'll notify you if this becomes available</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Duration & Notes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Duration */}
              <Card className="border">
                <Label>Session Duration</Label>
                <div className="flex gap-2">
                  {[1, 2, 3].map(h => (
                    <button
                      key={h}
                      onClick={() => setDuration(h)}
                      className="flex-1 py-3 rounded-lg border-2 font-bold transition-all"
                      style={{
                        backgroundColor: duration === h ? G.lime : G.sidebar,
                        borderColor: duration === h ? G.lime : G.cardBorder,
                        color: duration === h ? G.dark : G.text,
                      }}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </Card>

              {/* Notes */}
              <Card className="border">
                <Label>Session Notes (Optional)</Label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g., Bringing my own equipment..."
                  className="w-full px-3 py-2 rounded-lg border text-xs outline-none transition-colors resize-none"
                  style={{
                    backgroundColor: G.sidebar,
                    borderColor: G.cardBorder,
                    color: G.text,
                  }}
                />
              </Card>
            </div>
          </div>

          {/* Right: Summary & Policies (1 column on large screens) */}
          <div className="lg:col-span-1 space-y-5">
            {/* Summary Card - Sticky */}
            <div className="sticky top-6">
              <Card className="border">
                <Label>Booking Summary</Label>
                <div className="space-y-3 mb-5">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs py-1.5" style={{ borderBottomColor: `${G.cardBorder}55`, borderBottomWidth: '1px' }}>
                      <span style={{ color: G.muted }}>Court</span>
                      <span className="font-semibold">{courtName}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1.5" style={{ borderBottomColor: `${G.cardBorder}55`, borderBottomWidth: '1px' }}>
                      <span style={{ color: G.muted }}>Match Type</span>
                      <span className="font-semibold capitalize">{matchType}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1.5" style={{ borderBottomColor: `${G.cardBorder}55`, borderBottomWidth: '1px' }}>
                      <span style={{ color: G.muted }}>Date</span>
                      <span className="font-semibold">{new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1.5" style={{ borderBottomColor: `${G.cardBorder}55`, borderBottomWidth: '1px' }}>
                      <span style={{ color: G.muted }}>Time</span>
                      <span className="font-semibold" style={{ color: selectedSlot ? G.accent : G.muted }}>
                        {selectedSlot || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs py-1.5">
                      <span style={{ color: G.muted }}>Duration</span>
                      <span className="font-semibold">{duration}h</span>
                    </div>
                  </div>
                </div>

                {/* Total Price */}
                <div className="flex justify-between items-center py-4 px-3 rounded-lg mb-5" style={{ backgroundColor: G.sidebar, borderColor: G.cardBorder, borderWidth: '1px' }}>
                  <span className="text-xs font-bold" style={{ color: G.muted }}>TOTAL PRICE</span>
                  <span className="text-2xl font-black" style={{ color: G.lime }}>
                    ${totalPrice}
                  </span>
                </div>

                {/* Payment Method Selection */}
                {selectedSlot && (
                  <div className="mb-5 pb-4" style={{ borderBottomColor: G.cardBorder, borderBottomWidth: '2px' }}>
                    <Label>Payment Method</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'paypal', label: 'PayPal', icon: '🅿️' },
                        { id: 'stripe', label: 'Stripe', icon: '💳' },
                        { id: 'mpesa', label: 'M-Pesa', icon: '📱' },
                      ].map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id as any)}
                          className="py-3 rounded-lg border-2 transition-all text-xs font-bold flex flex-col items-center gap-1"
                          style={{
                            backgroundColor: paymentMethod === method.id ? G.lime : G.sidebar,
                            borderColor: paymentMethod === method.id ? G.lime : G.cardBorder,
                            color: paymentMethod === method.id ? G.dark : G.text,
                          }}
                        >
                          <span className="text-lg">{method.icon}</span>
                          <span>{method.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* M-Pesa Number Input */}
                {paymentMethod === 'mpesa' && selectedSlot && (
                  <div className="mb-5 pb-4" style={{ borderBottomColor: G.cardBorder, borderBottomWidth: '2px' }}>
                    <Label>M-Pesa Number</Label>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="254712345678"
                      maxLength={12}
                      className="w-full px-3 py-2 rounded-lg border text-xs outline-none transition-colors"
                      style={{
                        backgroundColor: G.sidebar,
                        borderColor: G.cardBorder,
                        color: G.text,
                      }}
                    />
                    <p className="text-[9px] mt-2" style={{ color: G.muted }}>
                      Format: 254712345678 (12 digits)
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {paymentError && (
                  <div className="mb-4 p-3 rounded-lg border-2" style={{ backgroundColor: `${G.red}20`, borderColor: G.red }}>
                    <p className="text-sm font-bold" style={{ color: G.red }}>
                      ❌ {paymentError}
                    </p>
                  </div>
                )}

                {/* Success Message */}
                {paymentSuccess && (
                  <div className="mb-4 p-3 rounded-lg border-2" style={{ backgroundColor: `${G.lime}20`, borderColor: G.lime }}>
                    <p className="text-sm font-bold" style={{ color: G.lime }}>
                      {paymentSuccess}
                    </p>
                  </div>
                )}

                {/* CTA Button */}
                <button
                  disabled={!selectedSlot || !paymentMethod || processing || (paymentMethod === 'mpesa' && mobileNumber.length < 12)}
                  onClick={handlePayment}
                  className="w-full py-4 rounded-lg font-black text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: selectedSlot && paymentMethod ? G.lime : G.mid,
                    color: selectedSlot && paymentMethod ? G.dark : G.muted,
                  }}
                >
                  {processing ? '⏳ Processing...' : selectedSlot && paymentMethod ? `✓ Pay $${totalPrice} via ${paymentMethod.toUpperCase()}` : 'Select time & payment method'}
                </button>

                {selectedSlot && (
                  <p className="text-[9px] text-center mt-3" style={{ color: G.muted }}>
                    Free cancellation up to 2 hours before
                  </p>
                )}
              </Card>

              {/* Policies Card */}
              <Card className="border">
                <Label>Booking Policies</Label>
                <div className="space-y-3">
                  {[
                    { icon: '✅', text: 'Free cancellation up to 2h before' },
                    { icon: '⚡', text: 'Instant confirmation on booking' },
                    { icon: '💳', text: 'Charged to saved payment method' },
                    { icon: '🔄', text: 'Reschedule up to 4h before' },
                    { icon: '📞', text: 'Contact club for special requests' },
                  ].map((p, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-sm">{p.icon}</span>
                      <span className="text-xs" style={{ color: G.muted }} >
                        {p.text}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingDetailsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12" style={{ color: '#7aaa6a' }}>Loading...</div>}>
      <BookingDetailsContent />
    </Suspense>
  );
}
