'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { LoadingState } from '@/components/LoadingState';
import {
  getAvailableCourts,
  getAvailableTimeSlots,
  createCourtBooking,
  getPlayerBookings,
  cancelCourtBooking,
  getPlayerOrganizations,
  getAllAvailableOrganizations,
} from '@/actions/bookings';
import { BookingConfirmation } from './BookingConfirmation';
import { CourtDetailModal } from './CourtDetailModal';

// ─── Shared primitives ────────────────────────────────────────────────────────

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-[#1a3020] border border-[#2d5a35] rounded-xl p-4 ${className}`}>
    {children}
  </div>
);

const Label: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`text-[10px] font-bold uppercase tracking-wider text-[#a8d84e] mb-2 ${className}`}>{children}</div>
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
  const color = pct >= 80 ? 'bg-red-500/70' : pct >= 50 ? 'bg-[#f0c040]/70' : 'bg-[#7dc142]/70';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-4 bg-[#152515] rounded-t overflow-hidden" style={{ height: 36 }}>
        <div className={`w-full rounded-t transition-all ${color} ${selected ? 'ring-1 ring-white' : ''}`} style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }} />
      </div>
      <span className="text-[8px] text-[#7aaa6a]">{hour}</span>
    </div>
  );
};

// ─── Court card ───────────────────────────────────────────────────────────────

const CourtCard: React.FC<{ court: any; selected: boolean; onClick: () => void }> = ({ court, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
      selected
        ? 'border-[#7dc142] bg-[#2d5a27]'
        : 'border-[#2d5a35] bg-[#152515] hover:border-[#7dc142]/50 hover:bg-[#2d5a27]/30'
    }`}
  >
    <div className="flex items-start justify-between mb-2">
      <div>
        <div className="text-sm font-bold text-[#e8f5e0]">{court.name}</div>
        <div className="text-[10px] text-[#7aaa6a] mt-0.5">{court.surface || 'Hard Court'}</div>
      </div>
      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${selected ? 'bg-[#7dc142] text-[#0f1f0f]' : 'bg-[#2d5a35] text-[#7aaa6a]'}`}>
        {selected ? '✓ Selected' : 'Available'}
      </span>
    </div>
    <div className="flex flex-wrap gap-1 mt-2">
      {(COURT_FEATURES[court.id] || COURT_FEATURES.default).map(f => (
        <span key={f} className="text-[9px] bg-[#0f1f0f] text-[#7aaa6a] px-1.5 py-0.5 rounded">{f}</span>
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
        className="flex flex-col items-center py-2 px-1 rounded-lg bg-[#3a2d2d] border border-[#5a2d2d] opacity-60 cursor-not-allowed relative group"
        title={slot.pendingCount > 0 ? `${slot.pendingCount} pending booking(s) - will notify if available` : 'Fully booked'}
      >
        <span className="text-xs font-bold text-[#7aaa6a]">{slot.time}</span>
        <span className="text-[8px] text-red-500 mt-0.5">Taken</span>
        
        {/* Pending count badge */}
        {slot.pendingCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
            style={{ backgroundColor: '#f0c040', color: '#000' }}
          >
            {slot.pendingCount}
          </span>
        )}
        
        {/* Hover tooltip for pending slots */}
        {slot.pendingCount > 0 && (
          <div 
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-max"
            style={{ backgroundColor: '#f0c040', color: '#000' }}
          >
            <div className="font-bold">{slot.pendingCount} pending</div>
            <div className="text-[9px]">We'll notify you if available</div>
          </div>
        )}
      </div>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center py-2 px-1 rounded-lg border-2 transition-all relative ${
        selected
          ? 'bg-[#7dc142] border-[#7dc142] text-[#0f1f0f]'
          : 'bg-[#152515] border-[#2d5a35] text-[#e8f5e0] hover:border-[#7dc142]/60 hover:bg-[#2d5a27]/40'
      }`}
    >
      <span className="text-xs font-bold">{slot.time}</span>
      <span className={`text-[8px] mt-0.5 font-semibold ${selected ? 'text-[#0f1f0f]' : slot.isPeak ? 'text-[#f0c040]' : 'text-[#7aaa6a]'}`}>
        ${slot.price}
      </span>
      {slot.isPeak && !selected && (
        <span className="text-[7px] text-[#f0c040]">Peak</span>
      )}
      
      {/* Pending count badge for available slots */}
      {slot.pendingCount > 0 && (
        <span 
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
          style={{ backgroundColor: '#f0c040', color: '#000' }}
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

  const statusColors: Record<string, string> = {
    confirmed: 'bg-[#7dc142] text-[#0f1f0f]',
    cancelled: 'bg-red-900/60 text-red-400',
    completed: 'bg-[#2d5a35] text-[#7aaa6a]',
  };

  return (
    <div className={`p-4 rounded-xl border transition-all ${booking.status === 'cancelled' ? 'border-red-900/40 opacity-60' : 'border-[#2d5a35] hover:border-[#7dc142]/40'} bg-[#152515]`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm font-bold text-[#e8f5e0]">🎾 {booking.court.name}</div>
          <div className="text-xs text-[#7aaa6a] mt-0.5">
            {start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>
        <span className={`text-[9px] font-black px-2 py-1 rounded-full ${statusColors[booking.status] || 'bg-[#2d5a35] text-[#7aaa6a]'}`}>
          {booking.status.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-[#0f1f0f] rounded-lg px-2 py-1.5 text-center">
          <div className="text-[9px] text-[#7aaa6a]">Start</div>
          <div className="text-xs font-bold text-[#e8f5e0]">{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <div className="bg-[#0f1f0f] rounded-lg px-2 py-1.5 text-center">
          <div className="text-[9px] text-[#7aaa6a]">End</div>
          <div className="text-xs font-bold text-[#e8f5e0]">{end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <div className="bg-[#0f1f0f] rounded-lg px-2 py-1.5 text-center">
          <div className="text-[9px] text-[#7aaa6a]">Duration</div>
          <div className="text-xs font-bold text-[#a8d84e]">{durationHrs}h</div>
        </div>
      </div>

      {isActive && canBook && (
        <div className="flex gap-2">
          <button className="flex-1 py-1.5 text-[10px] font-bold bg-[#2d5a27] hover:bg-[#3d7a32] text-[#7dc142] rounded-lg transition-colors">
            📅 Reschedule
          </button>
          <button
            onClick={() => onCancel(booking.id)}
            className="flex-1 py-1.5 text-[10px] font-bold bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-700/40 rounded-lg transition-colors"
          >
            ✕ Cancel
          </button>
        </div>
      )}
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

      // Call simulated payment endpoint for development/testing
      const paymentRes = await fetch('/api/bookings/simulate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: userIdFromURL,
          courtId: selectedCourt,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          organizationId: selectedOrgId,
          amount: bookingResult.booking.price,
          bookingId: bookingResult.booking.id,
        }),
      });

      if (!paymentRes.ok) {
        const errorData = await paymentRes.json();
        showToast('error', `❌ Booking failed: ${errorData.error}`);
        console.error('Simulated payment failed:', errorData);
        return;
      }

      const paymentData = await paymentRes.json();

      if (paymentData.success) {
        showToast('success', '✅ Booking confirmed! Your court is reserved.');

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
        <div className="text-4xl mb-4">🏢</div>
        <div className="text-base font-bold text-[#e8f5e0] mb-2">No Club Membership</div>
        <div className="text-sm text-[#7aaa6a] max-w-sm mx-auto">
          You need to be a member of a club to book courts. Contact your organisation administrator to join.
        </div>
      </Card>
    );
  }

  // ── No courts ──────────────────────────────────────────────────────────────
  if (courts.length === 0) {
    return (
      <Card className="text-center py-12">
        <div className="text-4xl mb-4">🎾</div>
        <div className="text-base font-bold text-[#e8f5e0] mb-2">No Courts Available</div>
        <div className="text-sm text-[#7aaa6a]">There are no courts available for booking at your club right now.</div>
      </Card>
    );
  }

  return (
    <div className={`w-full ${isEmbedded ? 'bg-gradient-to-br from-[#0f2710] via-[#0f1f0f] to-[#0d1f0d] p-5 rounded-xl' : ''}`}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#7dc142] tracking-tight">🎾 Court Booking</h1>
        <p className="text-sm text-[#7aaa6a] mt-1">Reserve a court for your next session</p>
      </div>

      {/* ── Stats strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { icon: '📅', label: 'My Bookings', value: existingBookings.filter(b => b.status !== 'cancelled').length },
          { icon: '🎾', label: 'Courts Open', value: courts.length },
          { icon: '⏰', label: 'Next Slot', value: '09:00' },
          { icon: '💰', label: 'Avg. Price', value: '$45/hr' },
        ].map(s => (
          <Card key={s.label} className="flex items-center gap-3 py-3">
            <span className="text-xl">{s.icon}</span>
            <div>
              <div className="text-[9px] text-[#7aaa6a] font-medium">{s.label}</div>
              <div className="text-lg font-black text-[#a8d84e] leading-tight">{s.value}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 bg-[#152515] p-1 rounded-xl">
        {[
          { id: 'booking', label: '+ New Booking', disabled: !canBook },
          { id: 'myBookings', label: `📋 My Bookings (${existingBookings.filter(b => new Date(b.startTime) >= new Date() && b.status !== 'cancelled').length})` },
          { id: 'history', label: '🕑 History' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
            disabled={tab.disabled}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-[#2d5a27] text-[#7dc142] border border-[#7dc142]/40'
                : 'text-[#7aaa6a] hover:text-[#e8f5e0] disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          NEW BOOKING TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'booking' && canBook && (
        <div className="scrollable-booking flex flex-col gap-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#7dc142 #152515' }}>
          <style>{`
            .scrollable-booking::-webkit-scrollbar {
              width: 6px;
            }
            .scrollable-booking::-webkit-scrollbar-track {
              background: #152515;
              border-radius: 10px;
            }
            .scrollable-booking::-webkit-scrollbar-thumb {
              background: #7dc142;
              border-radius: 10px;
            }
            .scrollable-booking::-webkit-scrollbar-thumb:hover {
              background: #a8d84e;
            }
          `}</style>

          {/* ── FORM SECTIONS (Top to Bottom) in Specified Order ──────────────────── */}
          <div className="space-y-4">

            {/* 1. Select Organization */}
            {organizations.length > 1 && (
              <Card>
                <Label>Select Organization</Label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#2d5a35] bg-[#152515] text-[#e8f5e0] text-sm focus:outline-none focus:border-[#7dc142]"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
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
                    className={`flex-1 py-2.5 rounded-lg border text-xs font-bold capitalize transition-all ${
                      matchType === t
                        ? 'bg-[#7dc142] border-[#7dc142] text-[#0f1f0f]'
                        : 'bg-[#152515] border-[#2d5a35] text-[#7aaa6a] hover:border-[#7dc142]/60'
                    }`}
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
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2d5a27] flex items-center justify-center text-xl">🎾</div>
                  <div>
                    <div className="text-sm font-bold text-[#e8f5e0]">{selectedCourtData.name}</div>
                    <div className="text-[10px] text-[#7aaa6a]">{selectedCourtData.surface || 'Hard Court'}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(COURT_FEATURES[selectedCourtData.id] || COURT_FEATURES.default).map(f => (
                    <span key={f} className="text-[9px] bg-[#0f1f0f] text-[#7aaa6a] px-2 py-1 rounded-lg">{f}</span>
                  ))}
                </div>
              </Card>
            )}

            {/* 5. Recently Active Players */}
            <Card>
              <Label>Recent Played</Label>
              <div className="space-y-2">
                {RECENT_PLAYERS.map(p => (
                  <div key={p.name} className="flex items-center gap-2 px-2 py-1.5 bg-[#152515] rounded-lg">
                    <span className="text-lg">{p.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[#e8f5e0] truncate">{p.name}</div>
                      <div className="text-[9px] text-[#7aaa6a]">{p.level}</div>
                    </div>
                    <div className="text-[9px] font-bold text-[#f0c040]">⭐ {p.rating}</div>
                  </div>
                ))}
                <button className="w-full py-1.5 text-[10px] font-bold text-[#7dc142] hover:text-[#a8d84e] transition-colors">
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
                className="w-full bg-[#2d5a27] border border-[#2d5a35] text-[#e8f5e0] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#7dc142] transition-colors"
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
              <div className="flex gap-3 mt-2 text-[9px] text-[#7aaa6a]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#7dc142]/70 inline-block" /> Low</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#f0c040]/70 inline-block" /> Medium</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500/70 inline-block" /> High</span>
              </div>
            </Card>

            {/* 8. Time Slot */}
            <Card>
              <Label>Time Slot</Label>
              {timeSlots.length === 0 ? (
                <div className="text-center py-6 text-[#7aaa6a] text-sm">No slots loaded — select a court and date above</div>
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
                placeholder="e.g. Bringing my own equipment, practising serve…"
                className="w-full bg-[#2d5a27] border border-[#2d5a35] text-[#e8f5e0] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#7dc142] resize-none placeholder-[#7aaa6a] transition-colors"
              />
            </Card>
          </div>

          {/* ── BOTTOM SECTION: 2-Column (Booking Summary + Policies) ────────── */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Left: Booking Summary + Payment */}
            <Card className={`transition-all ${selectedSlot ? 'border-[#7dc142]' : ''}`}>
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
                  <div key={r.label} className="flex justify-between text-xs py-1 border-b border-[#2d5a35]/50 last:border-0">
                    <span className="text-[#7aaa6a]">{r.label}</span>
                    <span className="font-semibold text-[#e8f5e0]">{r.value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-[#2d5a35]">
                  <span className="text-xs font-bold text-[#7aaa6a]">Total</span>
                  <span className="text-lg font-black text-[#7dc142]">${totalPrice || '—'}</span>
                </div>
              </div>

              {/* Payment method selector */}
              <div className="space-y-2 mb-4 pb-4 border-b border-[#2d5a35]">
                <Label className="text-xs font-bold">Payment Method</Label>
                <div className="grid grid-cols-3 gap-2">
                  {['mpesa', 'stripe', 'paypal'].map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method as 'mpesa' | 'stripe' | 'paypal')}
                      className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                        paymentMethod === method
                          ? 'bg-[#7dc142] border-[#7dc142] text-[#0f1f0f]'
                          : 'bg-[#152515] border-[#2d5a35] text-[#7aaa6a] hover:border-[#7dc142]/60'
                      }`}
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
                <div className="space-y-2 mb-4 pb-4 border-b border-[#2d5a35]">
                  <Label className="text-xs font-bold">M-Pesa Number</Label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={e => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="254712345678"
                    maxLength={12}
                    className="w-full bg-[#2d5a27] border border-[#2d5a35] text-[#e8f5e0] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#7dc142] placeholder-[#7aaa6a] transition-colors"
                  />
                  <p className="text-[10px] text-[#7aaa6a]">Format: 254712345678 (12 digits)</p>
                </div>
              )}

              <button
                onClick={handleBooking}
                disabled={!selectedSlot || booking || (paymentMethod === 'mpesa' && mobileNumber.length < 12)}
                className="w-full py-3 bg-[#7dc142] hover:bg-[#a8d84e] disabled:bg-[#2d5a27] disabled:text-[#7aaa6a] text-[#0f1f0f] font-black text-sm rounded-xl transition-all disabled:cursor-not-allowed"
              >
                {booking ? '⏳ Processing…' : selectedSlot ? `✓ Confirm & Pay via ${paymentMethod === 'mpesa' ? 'M-Pesa' : paymentMethod === 'stripe' ? 'Stripe' : 'PayPal'}` : 'Select a time slot'}
              </button>

              {selectedSlot && (
                <p className="text-[9px] text-[#7aaa6a] text-center mt-2">
                  Free cancellation up to 2h before session
                </p>
              )}
            </Card>

            {/* Right: Booking Policies */}
            <Card>
              <Label>Booking Policies</Label>
              <div className="space-y-2 text-[10px] text-[#7aaa6a]">
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
        <div className="scrollable-mybookings space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#7dc142 #152515' }}>
          <style>{`
            .scrollable-mybookings::-webkit-scrollbar {
              width: 6px;
            }
            .scrollable-mybookings::-webkit-scrollbar-track {
              background: #152515;
              border-radius: 10px;
            }
            .scrollable-mybookings::-webkit-scrollbar-thumb {
              background: #7dc142;
              border-radius: 10px;
            }
            .scrollable-mybookings::-webkit-scrollbar-thumb:hover {
              background: #a8d84e;
            }
          `}</style>
          {/* Filter pills */}
          <div className="flex gap-2">
            {(['all', 'upcoming', 'past'] as const).map(f => (
              <button
                key={f}
                onClick={() => setBookingFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all capitalize ${
                  bookingFilter === f
                    ? 'bg-[#7dc142] border-[#7dc142] text-[#0f1f0f]'
                    : 'bg-[#152515] border-[#2d5a35] text-[#7aaa6a] hover:border-[#7dc142]/60'
                }`}
              >
                {f} {f === 'upcoming' ? `(${existingBookings.filter(b => new Date(b.startTime) >= new Date() && b.status !== 'cancelled').length})` : ''}
              </button>
            ))}
          </div>

          {filteredBookings.length === 0 ? (
            <Card className="text-center py-12">
              <div className="text-4xl mb-3">📅</div>
              <div className="text-sm font-bold text-[#e8f5e0] mb-1">No bookings found</div>
              <div className="text-xs text-[#7aaa6a] mb-4">Book your first court session to get started</div>
              <button onClick={() => setActiveTab('booking')} className="bg-[#7dc142] text-[#0f1f0f] text-xs font-bold px-5 py-2 rounded-lg hover:bg-[#a8d84e] transition-colors">
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
        <div className="scrollable-history space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#7dc142 #152515' }}>
          <style>{`
            .scrollable-history::-webkit-scrollbar {
              width: 6px;
            }
            .scrollable-history::-webkit-scrollbar-track {
              background: #152515;
              border-radius: 10px;
            }
            .scrollable-history::-webkit-scrollbar-thumb {
              background: #7dc142;
              border-radius: 10px;
            }
            .scrollable-history::-webkit-scrollbar-thumb:hover {
              background: #a8d84e;
            }
          `}</style>
          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total Sessions', value: existingBookings.length, icon: '🎾' },
              { label: 'Hours on Court', value: `${existingBookings.reduce((a, b) => a + Math.round((new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 3600000), 0)}h`, icon: '⏱️' },
              { label: 'Favourite Court', value: courts[0]?.name || 'N/A', icon: '⭐' },
              { label: 'Total Spent', value: `$${existingBookings.length * 45}`, icon: '💰' },
            ].map(s => (
              <Card key={s.label} className="text-center py-3">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-base font-black text-[#a8d84e]">{s.value}</div>
                <div className="text-[9px] text-[#7aaa6a]">{s.label}</div>
              </Card>
            ))}
          </div>

          {/* Past bookings list */}
          {existingBookings.filter(b => new Date(b.startTime) < new Date()).length === 0 ? (
            <Card className="text-center py-10">
              <div className="text-3xl mb-3">🕑</div>
              <div className="text-sm text-[#7aaa6a]">No past sessions yet — get out on court!</div>
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
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl font-bold text-sm shadow-xl border ${
          toast.type === 'success'
            ? 'bg-[#7dc142] text-[#0f1f0f] border-[#a8d84e] shadow-[#7dc142]/20'
            : 'bg-red-900/90 text-red-200 border-red-700'
        }`}>
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