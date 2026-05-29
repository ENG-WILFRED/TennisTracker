'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { LoadingState } from '@/components/LoadingState';
import { formatKenyanMobileNumber } from '@/lib/phone';
import {
  getAvailableCourts,
  getAvailableTimeSlots,
  createCourtBooking,
  getPlayerBookings,
  cancelCourtBooking,
  getPlayerOrganizations,
  getAllAvailableOrganizations,
} from '@/actions/bookings';
import {
  processMPesaPayment,
  processPayPalPayment,
  processStripePayment,
} from '@/actions/payments';
import { BookingConfirmation } from './BookingConfirmation';
import { CourtDetailModal } from './CourtDetailModal';
import { colors } from '@vico/design-system';

const hexToRgb = (hex: string) => {
  const c = hex.replace('#', '');
  const full = c.length === 3 ? c.split('').map(ch => ch + ch).join('') : c;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r},${g},${b}`;
};

const G = {
  page: colors.background,
  surface: colors.surface,
  card: colors.surfaceSecondary,
  border: colors.border,
  primary: colors.primary,
  primaryHover: colors.primaryHover || colors.primary,
  text: colors.textPrimary,
  muted: colors.textMuted,
  warning: colors.warning,
  danger: colors.danger,
};

// ─── Shared primitives ────────────────────────────────────────────────────────

const Card: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({ children, className = '', style }) => (
  <div
    style={{
      background: G.surface,
      border: `1px solid rgba(${hexToRgb(G.primary)},0.32)`,
      borderRadius: 12,
      padding: 16,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
      ...(style || {}),
    }}
    className={className}
  >
    {children}
  </div>
);

const Label: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: G.primary, marginBottom: 8 }} className={className}>{children}</div>
);

// ─── Static mock data for new sections ────────────────────────────────────────

const POPULAR_TIMES = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const POPULARITY =   [2, 4, 7, 9, 6,  4,  5,  6,  7,  8,  9,  10, 9,  8,  6,  3 ];

const COURT_FEATURES: Record<string, string[]> = {
  default: ['🌞 Outdoor', '💡 Floodlit', '🔒 Access Card', '🪑 Seating'],
};

const RECENT_PLAYERS = [
  { name: 'Alex Kim', avatar: '🧑', level: 'Advanced', rating: 4.8 },
  { name: 'Sara Patel', avatar: '👩', level: 'Intermediate', rating: 4.2 },
  { name: 'Chris Do', avatar: '🧔', level: 'Advanced', rating: 4.6 },
];

// ─── Popularity heatmap bar ────────────────────────────────────────────────────

const PopularityBar: React.FC<{ hour: number; value: number; max: number; selected?: boolean }> = ({ hour, value, max, selected }) => {
  const pct = Math.round((value / max) * 100);
  const fillColor = pct >= 80 ? `rgba(${hexToRgb(G.danger)},0.7)` : pct >= 50 ? `rgba(${hexToRgb(G.warning)},0.7)` : `rgba(${hexToRgb(G.primary)},0.7)`;
  return (
    <div className="flex flex-col items-center gap-1">
      <div style={{ width: 16, background: G.surface, borderTopLeftRadius: 6, borderTopRightRadius: 6, overflow: 'hidden', height: 36 }}>
        <div style={{ width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6, transition: 'height 0.2s', background: fillColor, height: `${pct}%`, marginTop: `${100 - pct}%` }} />
      </div>
      <span style={{ fontSize: 8, color: G.muted }}>{hour}</span>
    </div>
  );
};

// ─── Court card ───────────────────────────────────────────────────────────────

const CourtCard: React.FC<{ court: any; selected: boolean; onClick: () => void }> = ({ court, selected, onClick }) => (
  <button
    onClick={onClick}
    style={{ width: '100%', textAlign: 'left', padding: 12, borderRadius: 12, borderWidth: 2, borderStyle: 'solid', transition: 'all .12s', background: selected ? G.card : G.surface, borderColor: selected ? G.primary : G.border }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 800, color: G.text }}>{court.name}</div>
        <div style={{ fontSize: 10, color: G.muted, marginTop: 4 }}>{court.surface || 'Hard Court'}</div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 8px', borderRadius: 999, background: selected ? G.primary : G.card, color: selected ? G.page : G.muted }}>
        {selected ? '✓ Selected' : 'Available'}
      </span>
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
      {(COURT_FEATURES[court.id] || COURT_FEATURES.default).map(f => (
        <span key={f} style={{ fontSize: 9, background: G.page, color: G.muted, padding: '3px 6px', borderRadius: 6 }}>{f}</span>
      ))}
    </div>
  </button>
);

// ─── Time slot button ─────────────────────────────────────────────────────────

const SlotButton: React.FC<{ slot: any; selected: boolean; onClick: () => void }> = ({ slot, selected, onClick }) => {
  if (!slot.available) {
    // Slot is booked and confirmed/no-show (disabled)
    return (
      <div
        title={slot.pendingCount > 0 ? `${slot.pendingCount} pending booking(s) - will notify if available` : 'Fully booked'}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px', borderRadius: 10, background: G.card, border: `1px solid ${G.border}`, opacity: 0.6, position: 'relative' }}
      >
        <span style={{ fontSize: 12, fontWeight: 800, color: G.muted }}>{slot.time}</span>
        <span style={{ fontSize: 10, color: G.danger, marginTop: 4 }}>Taken</span>

        {/* Pending count badge */}
        {slot.pendingCount > 0 && (
          <span
            style={{ position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: 999, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', background: G.warning, color: G.page }}
          >
            {slot.pendingCount}
          </span>
        )}

        {/* Hover tooltip for pending slots */}
        {slot.pendingCount > 0 && (
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: '100%', marginBottom: 8, padding: '6px 8px', borderRadius: 8, fontSize: 12, background: G.warning, color: G.page, zIndex: 10 }}>
            <div style={{ fontWeight: 800 }}>{slot.pendingCount} pending</div>
            <div style={{ fontSize: 11 }}>We&apos;ll notify you if available</div>
          </div>
        )}
      </div>
    );
  }
  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px', borderRadius: 10, border: `2px solid ${selected ? G.primary : G.border}`, transition: 'all .12s', position: 'relative', background: selected ? G.primary : G.surface, color: selected ? G.page : G.text }}
    >
      <span style={{ fontSize: 12, fontWeight: 800 }}>{slot.time}</span>
      <span style={{ fontSize: 10, marginTop: 4, fontWeight: 700, color: selected ? G.page : (slot.isPeak ? G.warning : G.muted) }}>{`$${slot.price}`}</span>
      {slot.isPeak && !selected && (
        <span style={{ fontSize: 9, color: G.warning }}>Peak</span>
      )}

      {/* Pending count badge for available slots */}
      {slot.pendingCount > 0 && (
        <span
          style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 999, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', background: G.warning, color: G.page }}
        >
          {slot.pendingCount}
        </span>
      )}
    </button>
  );
};

// ─── Booking item ─────────────────────────────────────────────────────────────

const BookingItem: React.FC<{ booking: any; canBook: boolean; onCancel: (id: string) => void }> = ({ booking, canBook, onCancel }) => {
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  const isPast = start < new Date();
  const isActive = booking.status === 'confirmed' && !isPast;
  const durationHrs = Math.round((end.getTime() - start.getTime()) / 3600000);

  const statusColors: Record<string, { bg: string; text: string }> = {
    confirmed: { bg: G.primary, text: G.page },
    cancelled: { bg: `rgba(${hexToRgb(G.danger)},0.6)`, text: G.danger },
    completed: { bg: G.card, text: G.muted },
  };

  const dotColor = booking.status === 'confirmed' ? G.primary : booking.status === 'completed' ? G.muted : booking.status === 'cancelled' ? G.danger : G.primary;

  return (
    <div
      style={{
        display: 'flex',
        background: G.surface,
        border: `1px solid rgba(${hexToRgb(G.primary)},0.32)`,
        borderRadius: 12,
        padding: 16,
        paddingLeft: 12,
        borderLeft: `4px solid ${dotColor}`,
        opacity: booking.status === 'cancelled' ? 0.7 : 1,
        transition: 'all .12s',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: G.text }}>🎾 {booking.court.name}</div>
            <div style={{ fontSize: 12, color: G.muted, marginTop: 6 }}>{start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: dotColor }}>{booking.status.toUpperCase()}</div>
            <div style={{ fontSize: 12, color: G.muted, marginTop: 6 }}>{`${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: G.muted, padding: '6px 8px', borderRadius: 8, background: G.surface }}>{booking.matchType || 'Single'}</span>
          {booking.price && <span style={{ fontSize: 12, fontWeight: 800, color: G.primary }}>{`$${booking.price}`}</span>}
          <span style={{ fontSize: 12, color: G.muted }}>{booking.playerCount ? `${booking.playerCount} players` : ''}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <div style={{ fontSize: 12, color: G.muted }}>Tap to view details</div>
          <div style={{ color: G.primary, fontWeight: 800 }}>→</div>
        </div>
      </div>

      {/* Actions */}
      {isActive && canBook ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 12, minWidth: 110 }}>
          <button style={{ padding: '8px 10px', fontSize: 12, fontWeight: 800, background: G.primary, color: G.page, borderRadius: 10, border: `1px solid ${G.primary}` }}>Reschedule</button>
          <button onClick={() => onCancel(booking.id)} style={{ padding: '8px 10px', fontSize: 12, fontWeight: 800, background: `rgba(${hexToRgb(G.danger)},0.12)`, color: G.danger, border: `1px solid rgba(${hexToRgb(G.danger)},0.4)`, borderRadius: 10 }}>Cancel</button>
        </div>
      ) : null}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

interface BookingViewProps {
  onClose?: () => void;
  isEmbedded?: boolean;
  canBook?: boolean;
  organizationId?: string;
}

export function BookingView({ onClose, isEmbedded = false, canBook = true, organizationId }: BookingViewProps) {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userIdFromURL = (params?.id as string) || authUser?.id;

  const [courts, setCourts] = useState<any[]>([]);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>(organizationId || '');
  const [selectedCourt, setSelectedCourt] = useState<string>('');
  const [matchType, setMatchType] = useState<'singles' | 'doubles' | 'practice'>('singles');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'booking' | 'myBookings' | 'history'>('booking');
  const [hasClubMembership, setHasClubMembership] = useState(true);
  const [bookingFilter, setBookingFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [showCourtModal, setShowCourtModal] = useState(false);
  const [selectedCourtForModal, setSelectedCourtForModal] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [duration, setDuration] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'stripe' | 'paypal'>('mpesa');
  const [booking, setBooking] = useState<boolean>(false);
  const [lastBooking, setLastBooking] = useState<any>(null);
  const [lastBookingIsMember, setLastBookingIsMember] = useState<boolean>(false);
  const [lastBookingStatus, setLastBookingStatus] = useState<string>('');
  const [showBookingConfirmation, setShowBookingConfirmation] = useState<boolean>(false);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!userIdFromURL) return;
      try {
        // Fetch all available organizations in the database
        const orgsData = await getAllAvailableOrganizations();
        setOrganizations(orgsData);

        // Set the selected organization
        if (organizationId) {
          setSelectedOrgId(organizationId);
        } else if (orgsData.length > 0) {
          setSelectedOrgId(orgsData[0].id);
        }
      } catch (error: any) {
        showToast('error', error.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userIdFromURL, organizationId]);

  // Load courts when selected organization changes
  useEffect(() => {
    const loadCourts = async () => {
      if (!userIdFromURL || !selectedOrgId) return;
      try {
        const courtsData = await getAvailableCourts(userIdFromURL, selectedOrgId);
        setCourts(courtsData);

        // Load bookings for this organization
        const bookingsData = await getPlayerBookings(userIdFromURL, selectedOrgId);
        setExistingBookings(bookingsData);
      } catch (error: any) {
        showToast('error', error.message);
      }
    };
    loadCourts();
  }, [userIdFromURL, selectedOrgId]);

  // Load time slots when court or date changes
  useEffect(() => {
    const loadTimeSlots = async () => {
      if (!selectedCourt || !selectedDate) {
        setTimeSlots([]);
        return;
      }
      try {
        const slots = await getAvailableTimeSlots(selectedCourt, selectedDate, selectedOrgId);
        setTimeSlots(slots || []);
      } catch (error: any) {
        console.error('Failed to load time slots:', error);
        setTimeSlots([]);
      }
    };
    loadTimeSlots();
  }, [selectedCourt, selectedDate, selectedOrgId]);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleCourtSelect = (court: any) => {
    setSelectedCourtForModal(court);
    setShowCourtModal(true);
  };

  const handleConfirmCourt = () => {
    // Navigate to detailed booking page with court info
    if (selectedCourtForModal && selectedOrgId) {
      router.push(`/player/booking/details?court=${selectedCourtForModal.id}&org=${selectedOrgId}&type=${matchType}`);
      setShowCourtModal(false);
    }
  };

  const handleViewBooking = (bookingId: string) => {
    if (selectedOrgId) {
      router.push(`/player/booking/${bookingId}?org=${selectedOrgId}`);
    }
  };

  const handleBooking = async () => {
    if (!userIdFromURL || !selectedOrgId) {
      showToast('error', 'Missing user or organization information');
      return;
    }
    setBooking(true);
    try {
      // Get time slot date and time
      const [hours, minutes] = selectedSlot.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + duration);

      const bookingResult = await createCourtBooking(
        userIdFromURL,
        selectedCourt,
        startTime.toISOString(),
        endTime.toISOString(),
        selectedOrgId
      );

      // Store booking info for confirmation modal
      setLastBooking(bookingResult.booking);
      setLastBookingIsMember(bookingResult.isMember);
      setLastBookingStatus(bookingResult.membershipStatus);
      setShowBookingConfirmation(true);

      // Process real payment based on selected payment method
      let paymentResult: any = null;

      let normalizedMobileNumber: string | undefined;
      if (paymentMethod === 'mpesa') {
        const result = formatKenyanMobileNumber(mobileNumber);
        if (!result.normalized) {
          showToast('error', result.error || 'Invalid mobile number. Use 254XXXXXXXXX or 078XXXXXXXX');
          setBooking(false);
          return;
        }
        normalizedMobileNumber = result.normalized;
        setMobileNumber(normalizedMobileNumber);

        paymentResult = await processMPesaPayment(
          normalizedMobileNumber,
          bookingResult.booking.price || 0,
          `COURT-${selectedCourt}-${Date.now()}`,
          `Court booking for ${selectedCourtData?.name || 'Tennis Court'}`,
          userIdFromURL,
          selectedOrgId,
          'court_booking',
          {
            courtId: selectedCourt,
            courtName: selectedCourtData?.name,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            bookingId: bookingResult.booking.id,
            notes: notes,
          }
        );

        if (paymentResult.success) {
          showToast('success', '✅ M-Pesa STK push sent. Complete payment on your phone.');
          // Reset form
          setSelectedSlot('');
          setDuration(1);
          setNotes('');
          setMobileNumber('');

          // Reload bookings after short delay
          setTimeout(async () => {
            const bookingsData = await getPlayerBookings(userIdFromURL, selectedOrgId);
            setExistingBookings(bookingsData);
          }, 2000);
        } else {
          showToast('error', `❌ Payment failed: ${paymentResult.error}`);
        }
      } else if (paymentMethod === 'paypal') {
        paymentResult = await processPayPalPayment(
          bookingResult.booking.price || 0,
          'USD',
          userIdFromURL,
          selectedOrgId,
          'court_booking',
          {
            courtId: selectedCourt,
            courtName: selectedCourtData?.name,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            bookingId: bookingResult.booking.id,
            notes: notes,
          }
        );

        if (paymentResult.success) {
          if (paymentResult.checkoutUrl) {
            showToast('success', 'Redirecting to PayPal...');
            setTimeout(() => {
              window.location.href = paymentResult.checkoutUrl;
            }, 1500);
          } else {
            showToast('error', 'PayPal checkout URL not available');
          }
        } else {
          showToast('error', `❌ Payment failed: ${paymentResult.error}`);
        }
      } else if (paymentMethod === 'stripe') {
        paymentResult = await processStripePayment(
          bookingResult.booking.price || 0,
          'USD',
          userIdFromURL,
          selectedOrgId,
          'court_booking',
          {
            courtId: selectedCourt,
            courtName: selectedCourtData?.name,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            bookingId: bookingResult.booking.id,
            notes: notes,
          },
          window.location.href,
          window.location.href
        );

        if (paymentResult.success) {
          // Show retry feedback if retries were attempted
          if (paymentResult.retriesAttempted && paymentResult.retriesAttempted > 0) {
            showToast('info', `⚠️ Payment gateway was slow, retried ${paymentResult.retriesAttempted} time(s). Redirecting to Stripe...`);
          } else {
            showToast('success', 'Redirecting to Stripe...');
          }

          if (paymentResult.checkoutUrl) {
            setTimeout(() => {
              window.location.href = paymentResult.checkoutUrl;
            }, 1500);
          } else {
            showToast('error', 'Stripe checkout URL not available');
          }
        } else {
          showToast('error', `❌ Payment failed: ${paymentResult.error}`);
        }
      }
    } catch (error: any) {
      showToast('error', error.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await cancelCourtBooking(bookingId, userIdFromURL!);
      showToast('success', 'Booking cancelled');
      const bookingsData = await getPlayerBookings(userIdFromURL!, selectedOrgId!);
      setExistingBookings(bookingsData);
    } catch (error: any) {
      showToast('error', error.message);
    }
  };

  const selectedSlotData = timeSlots.find(s => s.time === selectedSlot);
  const totalPrice = selectedSlotData ? selectedSlotData.price * duration : 0;
  const selectedCourtData = courts.find(c => c.id === selectedCourt);

  const filteredBookings = existingBookings.filter(b => {
    const isPast = new Date(b.startTime) < new Date();
    if (bookingFilter === 'upcoming') return !isPast && b.status !== 'cancelled';
    if (bookingFilter === 'past') return isPast || b.status === 'cancelled';
    return true;
  });

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return <LoadingState icon="🎾" message="Loading courts…" fullPage={false} />;
  }

  // ── No membership ──────────────────────────────────────────────────────────
  if (!hasClubMembership) {
    return (
      <Card className="text-center py-12">
        <div style={{ fontSize: 36, marginBottom: 16 }}>🏢</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: G.text, marginBottom: 8 }}>No Club Membership</div>
        <div style={{ fontSize: 14, color: G.muted, maxWidth: 360, margin: '0 auto' }}>
          You need to be a member of a club to book courts. Contact your organisation administrator to join.
        </div>
      </Card>
    );
  }

  // ── No courts ──────────────────────────────────────────────────────────────
  if (courts.length === 0) {
    return (
      <Card className="text-center py-12">
        <div style={{ fontSize: 36, marginBottom: 16 }}>🎾</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: G.text, marginBottom: 8 }}>No Courts Available</div>
        <div style={{ fontSize: 14, color: G.muted }}>There are no courts available for booking at your club right now.</div>
      </Card>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        background: isEmbedded ? `linear-gradient(135deg, ${G.page} 0%, ${G.surface} 50%, ${G.card} 100%)` : G.page,
        padding: 20,
        borderRadius: 12,
        border: `1px solid ${G.border}`,
      }}
    >

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: G.primary, letterSpacing: '-0.02em' }}>🎾 Court Booking</h1>
        <p style={{ fontSize: 14, color: G.muted, marginTop: 6 }}>Reserve a court for your next session</p>
      </div>

      {/* ── Stats strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { icon: '📅', label: 'My Bookings', value: existingBookings.filter(b => b.status !== 'cancelled').length },
          { icon: '🎾', label: 'Courts Open', value: courts.length },
          { icon: '⏰', label: 'Next Slot', value: '09:00' },
          { icon: '💰', label: 'Avg. Price', value: '$45/hr' },
        ].map(s => (
          <Card
            key={s.label}
            className="py-4 px-4"
            style={{
              background: colors.cardDarkBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 16,
              minHeight: 96,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: `0 12px 34px ${colors.cardShadow}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 10, color: G.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: G.primary, marginTop: 8 }}>{s.value}</div>
              </div>
              <span style={{ fontSize: 16, lineHeight: 1.2 }}>{s.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: G.surface, padding: 4, borderRadius: 12 }}>
        {[
          { id: 'booking', label: '+ New Booking', disabled: !canBook },
          { id: 'myBookings', label: `📋 My Bookings (${existingBookings.filter(b => new Date(b.startTime) >= new Date() && b.status !== 'cancelled').length})` },
          { id: 'history', label: '🕑 History' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
            disabled={tab.disabled}
            style={activeTab === tab.id ? { flex: 1, padding: '10px 8px', borderRadius: 10, fontSize: 12, fontWeight: 800, background: G.card, color: G.primary, border: `1px solid ${G.primary}` } : { flex: 1, padding: '10px 8px', borderRadius: 10, fontSize: 12, fontWeight: 800, color: G.muted }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          NEW BOOKING TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'booking' && canBook && (
        <div className="scrollable-booking flex flex-col gap-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: `${G.primary} ${G.surface}` }}>
          <style>{`
              .scrollable-booking::-webkit-scrollbar { width: 6px; }
              .scrollable-booking::-webkit-scrollbar-track { background: ${G.surface}; border-radius: 10px; }
              .scrollable-booking::-webkit-scrollbar-thumb { background: ${G.primary}; border-radius: 10px; }
              .scrollable-booking::-webkit-scrollbar-thumb:hover { background: ${G.warning || G.primary}; }
            `}</style>

          {/* ── FORM SECTIONS (Top to Bottom) in Specified Order ──────────────────── */}
          <div className="space-y-4">

            {/* 1. Select Organization */}
            {organizations.length > 1 && (
              <Card style={{ background: colors.cardDarkBg, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 0 0 1px ${colors.cardBorder}40, 0 18px 36px rgba(0,0,0,0.08)`, padding: 20, minHeight: 130 }}>
                <Label style={{ color: colors.cardLabel }}>Select Organization</Label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 44px 14px 14px',
                      borderRadius: 14,
                      border: `1px solid ${colors.cardBorder}`,
                      background: colors.cardDarkBg,
                      color: '#e8f5e0',
                      fontSize: 14,
                      outline: 'none',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
                    }}
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id} style={{ background: G.surface, color: G.text }}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: G.muted, pointerEvents: 'none', fontSize: 14 }}>▾</span>
                </div>
              </Card>
            )}

            {/* 2. Match Type */}
            <Card>
              <Label>Match Type</Label>
              <div className="flex gap-2">
                {(['singles', 'doubles', 'practice'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setMatchType(t)}
                    style={matchType === t ? { flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${G.primary}`, background: G.primary, color: G.page, fontSize: 12, fontWeight: 800, textTransform: 'capitalize' } : { flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${G.border}`, background: G.surface, color: G.muted, fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}
                  >
                    {t === 'singles' ? '🎾' : t === 'doubles' ? '👥' : '🏋️'} {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </Card>

            {/* 3. Select Court */}
            <Card>
              <Label>Court</Label>
              <div className="grid grid-cols-2 gap-2">
                {courts.map(court => (
                  <CourtCard
                    key={court.id}
                    court={court}
                    selected={selectedCourt === court.id}
                    onClick={() => setSelectedCourt(court.id)}
                  />
                ))}
              </div>
            </Card>

            {/* 4. Court Details */}
            {selectedCourtData && (
              <Card>
                <Label>Court Detail</Label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: G.primaryHover || G.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎾</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: G.text }}>{selectedCourtData.name}</div>
                    <div style={{ fontSize: 10, color: G.muted }}>{selectedCourtData.surface || 'Hard Court'}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(COURT_FEATURES[selectedCourtData.id] || COURT_FEATURES.default).map(f => (
                    <span key={f} style={{ fontSize: 11, background: G.page, color: G.muted, padding: '6px 8px', borderRadius: 8 }}>{f}</span>
                  ))}
                </div>
              </Card>
            )}

            {/* 5. Recently Active Players */}
            <Card>
              <Label>Recent Played</Label>
              <div className="space-y-2">
                {RECENT_PLAYERS.map(p => (
                  <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px', background: G.surface, borderRadius: 10 }}>
                    <span style={{ fontSize: 18 }}>{p.avatar}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: G.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: G.muted }}>{p.level}</div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 900, color: G.warning }}>⭐ {p.rating}</div>
                  </div>
                ))}
                <button style={{ width: '100%', padding: '8px', fontSize: 12, fontWeight: 800, color: G.primary, background: 'transparent', border: 'none' }}>
                  Find a partner →
                </button>
              </div>
            </Card>

            {/* 6. Date */}
            <Card>
              <Label>Date</Label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setSelectedDate(e.target.value)}
                style={{ width: '100%', background: G.primaryHover || G.primary, border: `1px solid ${G.border}`, color: G.text, borderRadius: 10, padding: '8px', fontSize: 14, outline: 'none' }}
              />
            </Card>

            {/* 7. Peak Hours */}
            <Card>
              <Label>Peak Hours</Label>
              <div className="flex items-end gap-1 justify-between px-1">
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
                    <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: G.muted }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: 4, background: `rgba(${hexToRgb(G.primary)},0.7)`, display: 'inline-block' }} /> Low</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: 4, background: `rgba(${hexToRgb(G.warning)},0.7)`, display: 'inline-block' }} /> Medium</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: 4, background: `rgba(${hexToRgb(G.danger)},0.7)`, display: 'inline-block' }} /> High</span>
                    </div>
            </Card>

            {/* 8. Time Slot */}
            <Card>
              <Label>Time Slot</Label>
              {timeSlots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '18px 0', color: G.muted, fontSize: 14 }}>No slots loaded — select a court and date above</div>
              ) : (
                <div className="grid grid-cols-8 gap-1.5">
                  {timeSlots.map(slot => (
                    <SlotButton
                      key={slot.hour}
                      slot={slot}
                      selected={selectedSlot === slot.time}
                      onClick={() => setSelectedSlot(slot.time)}
                    />
                  ))}
                </div>
              )}
            </Card>

            {/* 9. Notes */}
            <Card>
              <Label>Notes</Label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={4}
                placeholder={notes || 'e.g. Bringing my own equipment, practising serve…'}
                style={{ width: '100%', background: G.primaryHover || G.primary, border: `1px solid ${G.border}`, color: G.text, borderRadius: 10, padding: '8px', fontSize: 12, outline: 'none', resize: 'none' }}
              />
            </Card>
          </div>

          {/* ── BOTTOM SECTION: 2-Column (Booking Summary + Policies) ────────── */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Left: Booking Summary + Payment */}
            <Card className="transition-all" style={selectedSlot ? { border: `1px solid ${G.primary}` } : {}}>
              <Label>Booking Summary</Label>
              <div className="space-y-2 mb-4">
                {[
                  { label: 'Court', value: selectedCourtData?.name || '—' },
                  { label: 'Surface', value: selectedCourtData?.surface || '—' },
                  { label: 'Type', value: matchType.charAt(0).toUpperCase() + matchType.slice(1) },
                  { label: 'Date', value: selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—' },
                  { label: 'Time', value: selectedSlot || '—' },
                  { label: 'Duration', value: `${duration}h` },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: `1px solid rgba(${hexToRgb(G.border)},0.5)` }}>
                    <span style={{ color: G.muted }}>{r.label}</span>
                    <span style={{ fontWeight: 800, color: G.text }}>{r.value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: `1px solid ${G.border}` }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: G.muted }}>Total</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: G.primary }}>${totalPrice || '—'}</span>
                </div>
              </div>

              {/* Payment method selector */}
              <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${G.border}` }}>
                <Label className="text-xs font-bold">Payment Method</Label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {['mpesa', 'stripe', 'paypal'].map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method as 'mpesa' | 'stripe' | 'paypal')}
                      style={paymentMethod === method ? { padding: '10px', borderRadius: 10, border: `1px solid ${G.primary}`, background: G.primary, color: G.page, fontWeight: 800 } : { padding: '10px', borderRadius: 10, border: `1px solid ${G.border}`, background: G.surface, color: G.muted, fontWeight: 700 }}
                    >
                      {method === 'mpesa' && 'M-Pesa'}
                      {method === 'stripe' && 'Stripe'}
                      {method === 'paypal' && 'PayPal'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile number input for M-Pesa */}
              {paymentMethod === 'mpesa' && (
                <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${G.border}` }}>
                  <Label className="text-xs font-bold">M-Pesa Number</Label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={e => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="254712345678 or 0789898989"
                    maxLength={12}
                    style={{ width: '100%', background: G.primaryHover || G.primary, border: `1px solid ${G.border}`, color: G.text, borderRadius: 10, padding: '8px', fontSize: 14, outline: 'none' }}
                  />
                  <p style={{ fontSize: 11, color: G.muted }}>
                    Format: 254712345678, +254712345678, or 0789898989
                  </p>
                </div>
              )}

              <button
                onClick={handleBooking}
                disabled={
                  !selectedSlot ||
                  booking ||
                  (paymentMethod === 'mpesa' && !formatKenyanMobileNumber(mobileNumber).normalized)
                }
                style={{ width: '100%', padding: '12px', background: G.primary, color: G.page, fontWeight: 900, borderRadius: 14, fontSize: 14, border: 'none' }}
              >
                {booking ? '⏳ Processing…' : selectedSlot ? `✓ Confirm & Pay via ${paymentMethod === 'mpesa' ? 'M-Pesa' : paymentMethod === 'stripe' ? 'Stripe' : 'PayPal'}` : 'Select a time slot'}
              </button>

              {selectedSlot && (
                <p style={{ fontSize: 11, color: G.muted, textAlign: 'center', marginTop: 8 }}>
                  Free cancellation up to 2h before session
                </p>
              )}
            </Card>

            {/* Right: Booking Policies */}
            <Card>
              <Label>Booking Policies</Label>
              <div style={{ display: 'grid', gap: 8, fontSize: 12, color: G.muted }}>
                {[
                  { icon: '✅', text: 'Free cancellation up to 2h before' },
                  { icon: '⚡', text: 'Instant confirmation on booking' },
                  { icon: '💳', text: 'Charged to your saved payment method' },
                  { icon: '🔄', text: 'Reschedule up to 4h before session' },
                  { icon: '📞', text: 'Contact club for special requests' },
                ].map(p => (
                  <div key={p.text} className="flex items-start gap-2">
                    <span>{p.icon}</span>
                    <span>{p.text}</span>
                  </div>
                ))}
              </div>
            </Card>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MY BOOKINGS TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'myBookings' && (
        <div className="scrollable-mybookings space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: `${G.primary} ${G.surface}` }}>
          <style>{`
              .scrollable-mybookings::-webkit-scrollbar { width: 6px; }
              .scrollable-mybookings::-webkit-scrollbar-track { background: ${G.surface}; border-radius: 10px; }
              .scrollable-mybookings::-webkit-scrollbar-thumb { background: ${G.primary}; border-radius: 10px; }
              .scrollable-mybookings::-webkit-scrollbar-thumb:hover { background: ${G.warning || G.primary}; }
            `}</style>
          {/* Filter pills */}
          <style jsx>{`
            .filter-pills { display:flex; gap:8px; padding:10px; background: ${G.surface}; border: 1px solid ${G.border}; border-radius: 14px; }
            .filter-pills button { border: 1px solid transparent; border-radius: 999px; background: ${G.page}; color: ${G.muted}; font-size: 12px; font-weight: 800; padding: 8px 14px; cursor: pointer; transition: background .12s ease, color .12s ease, border-color .12s ease; text-transform: capitalize; }
            .filter-pills button:hover { background: ${G.card}; }
            .filter-pills button.active { background: ${G.primary}; color: ${G.page}; border-color: ${G.primary}; }
          `}</style>
          <div className="filter-pills">
            {(['all', 'upcoming', 'past'] as const).map(f => (
              <button
                key={f}
                onClick={() => setBookingFilter(f)}
                className={bookingFilter === f ? 'active' : ''}
                type="button"
              >
                {f} {f === 'upcoming' ? `(${existingBookings.filter(b => new Date(b.startTime) >= new Date() && b.status !== 'cancelled').length})` : ''}
              </button>
            ))}
          </div>

          {filteredBookings.length === 0 ? (
            <Card className="text-center py-12">
              <div className="text-4xl mb-3">📅</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: G.text, marginBottom: 8 }}>No bookings found</div>
              <div style={{ fontSize: 12, color: G.muted, marginBottom: 16 }}>Book your first court session to get started</div>
              <button onClick={() => setActiveTab('booking')} style={{ background: G.primary, color: G.page, fontSize: 12, fontWeight: 800, padding: '8px 14px', borderRadius: 10, border: 'none' }}>
                + New Booking
              </button>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredBookings.map(b => (
                <BookingItem key={b.id} booking={b} canBook={canBook} onCancel={handleCancelBooking} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          HISTORY TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="scrollable-history space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: `${G.primary} ${G.surface}` }}>
          <style>{`
            .scrollable-history::-webkit-scrollbar {
              width: 6px;
            }
.scrollable-history::-webkit-scrollbar-track { background: ${G.surface}; border-radius: 10px; }
            .scrollable-history::-webkit-scrollbar-thumb { background: ${G.primary}; border-radius: 10px; }
            .scrollable-history::-webkit-scrollbar-thumb:hover { background: ${G.warning || G.primary}; }
          `}</style>
          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total Sessions', value: existingBookings.length, icon: '🎾' },
              { label: 'Hours on Court', value: `${existingBookings.reduce((a, b) => a + Math.round((new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 3600000), 0)}h`, icon: '⏱️' },
              { label: 'Favourite Court', value: courts[0]?.name || 'N/A', icon: '⭐' },
              { label: 'Total Spent', value: `$${existingBookings.length * 45}`, icon: '💰' },
            ].map(s => (
              <Card key={s.label} className="text-center py-3" style={{ boxShadow: '0 18px 40px rgba(0,0,0,0.16)' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: G.warning }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: G.muted }}>{s.label}</div>
              </Card>
            ))}
          </div>

          {/* Past bookings list */}
          {existingBookings.filter(b => new Date(b.startTime) < new Date()).length === 0 ? (
            <Card className="text-center py-10">
              <div className="text-3xl mb-3">🕑</div>
              <div style={{ fontSize: 14, color: G.muted }}>No past sessions yet — get out on court!</div>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {existingBookings
                .filter(b => new Date(b.startTime) < new Date())
                .map(b => (
                  <BookingItem key={b.id} booking={b} canBook={false} onCancel={() => {}} />
                ))}
            </div>
          )}
        </div>
      )}

      {/* ── Toast ───────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={ toast.type === 'success' ? { position: 'fixed', right: 24, bottom: 24, zIndex: 50, padding: '12px 20px', borderRadius: 16, fontWeight: 800, fontSize: 14, boxShadow: `0 8px 24px rgba(${hexToRgb(G.primary)},0.12)`, border: `1px solid ${G.warning}`, background: G.primary, color: G.page } : { position: 'fixed', right: 24, bottom: 24, zIndex: 50, padding: '12px 20px', borderRadius: 16, fontWeight: 800, fontSize: 14, boxShadow: `0 8px 24px rgba(0,0,0,0.2)`, border: `1px solid ${G.danger}`, background: `rgba(${hexToRgb(G.danger)},0.9)`, color: '#fff' } }>
          {toast.message}
        </div>
      )}

      {/* ── Booking Confirmation Modal ──────────────────────────────────────── */}
      {showBookingConfirmation && lastBooking && selectedOrgId && (
        <BookingConfirmation
          booking={lastBooking}
          playerId={userIdFromURL || ''}
          organizationId={selectedOrgId}
          organization={organizations.find((org) => org.id === selectedOrgId)}
          isMember={lastBookingIsMember}
          membershipStatus={lastBookingStatus}
          onClose={() => {
            setShowBookingConfirmation(false);
            setActiveTab('myBookings');
          }}
          onMembershipPurchased={() => {
            setShowBookingConfirmation(false);
            setActiveTab('myBookings');
            showToast('success', '🎉 Welcome to your membership!');
          }}
        />
      )}
    </div>
  );
}