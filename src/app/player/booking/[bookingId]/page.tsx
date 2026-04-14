'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cancelCourtBooking } from '@/actions/bookings';
import { LoadingState } from '@/components/LoadingState';
import Link from 'next/link';

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
  const sourceTab = searchParams.get('tab') || 'myBookings';

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newHour, setNewHour] = useState('');
  const [rescheduling, setRescheduling] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch booking');
        }

        const bookingData = await response.json();
        setBooking(bookingData);
      } catch (error) {
        console.error('Error fetching booking:', error);
        showToast('error', 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  // Fetch available time slots when date is selected for reschedule
  useEffect(() => {
    const fetchSlots = async () => {
      if (!newDate || !booking) return;
      
      setLoadingSlots(true);
      try {
        const response = await fetch(`/api/bookings/available-slots?court=${booking.courtId}&date=${newDate}&org=${orgId}`);
        if (response.ok) {
          const slots = await response.json();
          setAvailableSlots(slots || []);
          setNewHour('');
        }
      } catch (error) {
        console.error('Failed to fetch available slots:', error);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    
    fetchSlots();
  }, [newDate, booking, orgId]);

  const handleCancel = () => {
    if (!booking) return;

    // Check if booking status allows cancellation - only pending bookings can be cancelled
    if (booking.status !== 'pending') {
      showToast('error', `Only pending bookings can be cancelled. This booking is ${booking.status}.`);
      return;
    }

    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!user?.id || !bookingId || !booking) return;

    setCancelling(true);
    try {
      await cancelCourtBooking(bookingId, user.id);
      
      // Immediately update the booking status to cancelled
      setBooking({
        ...booking,
        status: 'cancelled',
      });

      showToast('success', 'Booking cancelled successfully');
      setTimeout(() => router.back(), 1500);
    } catch (error: any) {
      showToast('error', error.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
    }
  };

  const handleReschedule = () => {
    if (!booking) return;

    // Check if booking status allows rescheduling
    if (booking.status !== 'confirmed') {
      showToast('error', `Cannot reschedule a ${booking.status} booking`);
      return;
    }

    setShowRescheduleModal(true);
  };

  const submitReschedule = async () => {
    if (!newDate || !newHour || !user?.id || !bookingId) {
      showToast('error', 'Please select a date and time slot');
      return;
    }

    setRescheduling(true);
    try {
      // Create newTime from selected hour (format HH:00)
      const timeString = `${String(newHour).padStart(2, '0')}:00`;
      
      // In production, this would call an API endpoint to reschedule the booking
      const response = await fetch('/api/bookings/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          playerId: user.id,
          newDate,
          newTime: timeString,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reschedule booking');
      }

      const result = await response.json();

      // Parse the raw times from the response to calculate proper end time
      const newStartDateTime = new Date(result.booking.startTime);
      const newEndDateTime = new Date(result.booking.endTime);

      // Format the new date for display
      const formattedDate = newStartDateTime.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });

      const formattedStartTime = newStartDateTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const formattedEndTime = newEndDateTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      // Immediately update the booking state with new details
      setBooking({
        ...booking,
        date: formattedDate,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        status: 'pending', // Status changed to pending
      });

      showToast('success', 'Booking rescheduled successfully - pending approval');
      setShowRescheduleModal(false);
      setNewDate('');
      setNewTime('');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to reschedule booking');
    } finally {
      setRescheduling(false);
    }
  };

  const handleContactOrg = () => {
    if (!booking?.chatRoomId || !booking?.organizationName) {
      showToast('error', 'Unable to contact organization');
      return;
    }

    // Navigate to chat page with the org's DM room
    router.push(`/chat?room=${booking.chatRoomId}&org=${booking.organizationId}`);
  };

  if (loading) {
    return <LoadingState icon="🎾" message="Loading booking details..." />;
  }

  if (!booking) {
    return <LoadingState icon="❌" message="Booking not found. Please check the booking ID and try again." />;
  }

  const isConfirmed = booking.status === 'confirmed';
  const isPending = booking.status === 'pending';
  const isRejected = booking.status === 'rejected';
  const statusColors = {
    confirmed: { bg: '#2d5a27', text: '#7dc142' },
    pending: { bg: '#5a4a2d', text: '#f0c040' },
    cancelled: { bg: '#5a2d2d', text: '#ff6b6b' },
    rejected: { bg: '#5a2d2d', text: '#ff6b6b' },
    completed: { bg: '#2d5a27', text: '#7dc142' },
    'no-show': { bg: '#5a2d2d', text: '#ff6b6b' },
  };
  const statusLabel = {
    confirmed: '✓ Confirmed',
    pending: '⏳ Pending Approval',
    cancelled: '✕ Cancelled',
    rejected: '✕ Rejected',
    completed: '✓ Completed',
    'no-show': '✕ No Show',
  };

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6 lg:p-8" style={{ background: G.sidebar, color: G.text }}>
      <div className="mx-auto max-w-6xl flex flex-col">
        {/* Header with Back Button */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 sm:gap-2 font-semibold mb-3 sm:mb-4 transition-colors hover:opacity-80 active:scale-95 min-h-[44px] px-2"
            style={{ color: G.lime }}
          >
            <span className="text-xl sm:text-2xl">←</span>
            <span className="hidden sm:inline text-sm md:text-base">Back</span>
          </button>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-1 sm:mb-2" style={{ color: G.lime }}>Booking Details</h1>
          <p className="text-[10px] sm:text-xs md:text-sm break-all" style={{ color: G.muted }}>Booking ID: <span className="font-mono font-semibold">{bookingId}</span></p>
        </div>

        {/* Two Column Layout - Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          
          {/* Rejection Notice */}
          {booking.status === 'rejected' && (
            <div className="md:col-span-2 p-3 sm:p-4 rounded-lg border" style={{ background: '#5a2d2d', borderColor: '#ff6b6b' }}>
              <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
                <span className="text-2xl sm:text-3xl flex-shrink-0">❌</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-xs sm:text-sm md:text-base" style={{ color: '#ff6b6b' }}>Booking Rejected</p>
                  {booking.rejectionReason && (
                    <p className="text-[10px] sm:text-xs md:text-sm mt-1 sm:mt-2 p-2 rounded break-words" style={{ background: '#4a2424', color: '#ff9999' }}>
                      <strong>Reason:</strong> {booking.rejectionReason}
                    </p>
                  )}
                  <p className="text-[10px] sm:text-xs md:text-sm mt-2" style={{ color: G.muted }}>Your booking request has been rejected by the organization. Please try booking a different time slot or contact the facility for more information.</p>
                </div>
              </div>
            </div>
          )}

          {/* Pending Notice */}
          {booking.status === 'pending' && (
            <div className="md:col-span-2 p-3 sm:p-4 rounded-lg border" style={{ background: '#5a4a2d', borderColor: '#f0c040' }}>
              <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
                <span className="text-2xl sm:text-3xl flex-shrink-0">⏳</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-xs sm:text-sm md:text-base" style={{ color: '#f0c040' }}>Rescheduling Pending Approval</p>
                  <p className="text-[10px] sm:text-xs md:text-sm mt-1" style={{ color: G.muted }}>Your rescheduling request has been submitted. The organization will review and approve your new booking time.</p>
                </div>
              </div>
            </div>
          )}
          
          {/* LEFT COLUMN */}
          <div>
            {/* Main Booking Info Card */}
            <Card className="mb-4 sm:mb-6">
              <Label>📅 Booking Information</Label>
              
              <div className="rounded-lg p-3 sm:p-4 mb-3 sm:mb-4" style={{ background: G.mid }}>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: G.muted }}>Court</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-black break-words" style={{ color: G.text }}>{booking.court}</p>
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: G.muted }}>Status</p>
                    <div className="inline-block px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs md:text-sm font-bold capitalize" style={{ background: statusColors[booking.status as keyof typeof statusColors]?.bg, color: statusColors[booking.status as keyof typeof statusColors]?.text }}>
                      {statusLabel[booking.status as keyof typeof statusLabel]}
                    </div>
                  </div>
                </div>
              </div>

              {/* Time and Details */}
              <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                {[
                  { label: 'Date', value: booking.date, icon: '📅' },
                  { label: 'Time', value: `${booking.startTime} - ${booking.endTime}`, icon: '🕙' },
                  { label: 'Duration', value: booking.duration, icon: '⏱️' },
                  { label: 'Price', value: booking.price, icon: '💵' },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between p-2 sm:p-3 rounded-lg" style={{ background: G.mid }}>
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <span className="text-lg sm:text-xl flex-shrink-0">{r.icon}</span>
                      <span className="font-semibold text-[10px] sm:text-sm md:text-base" style={{ color: G.lime }}>{r.label}</span>
                    </div>
                    <span className="font-bold text-[10px] sm:text-sm md:text-base ml-2 text-right" style={{ color: G.accent }}>{r.value}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <button 
                  onClick={handleReschedule}
                  disabled={!isConfirmed || rescheduling}
                  className="py-2 sm:py-3 px-2 rounded-lg font-bold text-[10px] sm:text-sm transition-all active:scale-95 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2 min-h-[44px]" 
                  style={{ background: isConfirmed && !rescheduling ? G.bright : G.mid, color: G.text }}
                  title={isConfirmed ? 'Reschedule this booking' : `Cannot reschedule a ${booking.status} booking (only confirmed can be rescheduled)`}
                >
                  {rescheduling ? (
                    <>
                      <span className="animate-spin">⏳</span> <span className="hidden sm:inline">Loading...</span>
                    </>
                  ) : (
                    <>📅 <span className="hidden sm:inline">Reschedule</span></>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={!isPending || cancelling}
                  className="py-2 sm:py-3 px-2 rounded-lg font-bold text-[10px] sm:text-sm transition-all active:scale-95 border hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2 min-h-[44px]"
                  style={{ background: isPending && !cancelling ? '#7a3a3a' : '#5a2d2d', color: isPending && !cancelling ? '#ff6b6b' : '#996666', borderColor: '#a55050' }}
                  title={isPending ? 'Cancel this pending booking' : `Cannot cancel a ${booking.status} booking (only pending can be cancelled)`}
                >
                  {cancelling ? (
                    <>
                      <span className="animate-spin">⏳</span> <span className="hidden sm:inline">Loading...</span>
                    </>
                  ) : (
                    <>✕ <span className="hidden sm:inline">Cancel</span></>
                  )}
                </button>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            {/* Important Information Card */}
            <Card className="mb-4 sm:mb-6">
              <Label>⚡ Important Information</Label>
              <div className="space-y-2 sm:space-y-3">
                {[
                  { icon: '⏰', title: 'Cancellation Policy', text: 'Free cancellation up to 2 hours before your session' },
                  { icon: '🔔', title: 'Reminder', text: 'You will receive a reminder 24 hours before your booking' },
                  { icon: '📍', title: 'Check-in', text: 'Please arrive 10 minutes early for check-in' },
                  { icon: '👥', title: 'Player Limit', text: 'Maximum 2 players per court unless specified otherwise' },
                ].map(p => (
                  <div key={p.text} className="flex gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-all" style={{ background: G.mid }}>
                    <span className="text-xl sm:text-2xl flex-shrink-0">{p.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[10px] sm:text-xs md:text-sm" style={{ color: G.accent }}>{p.title}</p>
                      <p className="text-[10px] sm:text-xs md:text-sm mt-0.5 sm:mt-1" style={{ color: G.muted }}>{p.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Contact Support Card */}
            <Card>
              <Label>📞 Need Help?</Label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg" style={{ background: G.mid }}>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[10px] sm:text-sm md:text-base" style={{ color: G.accent }}>Contact {booking.organizationName}</p>
                  <p className="text-[10px] sm:text-xs md:text-sm mt-0.5 sm:mt-1" style={{ color: G.muted }}>Send a direct message</p>
                </div>
                <button 
                  onClick={handleContactOrg}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg font-semibold text-[10px] sm:text-sm transition-colors active:scale-95 hover:opacity-90 min-h-[44px] sm:min-h-auto flex items-center justify-center gap-1 sm:gap-2" 
                  style={{ background: G.lime, color: G.dark }}
                >
                  💬 <span className="hidden sm:inline">Message</span>
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50 px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-bold text-[10px] sm:text-sm shadow-lg border transition-all max-w-xs sm:max-w-sm`} style={{ background: toast.type === 'success' ? G.lime : '#d45555', color: toast.type === 'success' ? G.dark : G.text, borderColor: toast.type === 'success' ? G.accent : '#ff8080' }}>
          {toast.type === 'success' ? '✓ ' : '✕ '}{toast.message}
        </div>
      )}

          {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <Card className="w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl md:text-5xl mb-3 sm:mb-4">⚠️</div>
              <h2 className="text-base sm:text-lg md:text-xl font-black mb-1 sm:mb-2" style={{ color: G.text }}>Cancel Booking?</h2>
              <p className="text-[10px] sm:text-xs md:text-sm mb-4 sm:mb-6" style={{ color: G.muted }}>Are you sure you want to cancel this booking? This action cannot be undone.</p>
              
              <div className="p-2 sm:p-3 md:p-4 rounded-lg mb-4 sm:mb-6" style={{ background: G.mid }}>
                <p className="text-[9px] sm:text-[10px] md:text-xs font-semibold mb-1 sm:mb-2" style={{ color: G.accent }}>Booking Details</p>
                <p className="text-[10px] sm:text-xs md:text-sm break-words" style={{ color: G.text }}>{booking.court} - {booking.date} at {booking.startTime}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                  className="py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 rounded-lg font-semibold text-[10px] sm:text-xs md:text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center"
                  style={{ background: G.mid, color: G.text }}
                >
                  <span className="hidden sm:inline">← Keep Booking</span>
                  <span className="sm:hidden">Keep</span>
                </button>
                <button
                  onClick={confirmCancel}
                  disabled={cancelling}
                  className="py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 rounded-lg font-semibold text-[10px] sm:text-xs md:text-sm transition-all active:scale-95 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2 border min-h-[44px]"
                  style={{ background: '#7a3a3a', color: cancelling ? '#996666' : '#ff6b6b', borderColor: '#a55050' }}
                >
                  {cancelling ? (
                    <>
                      <span className="animate-spin">⏳</span> <span className="hidden sm:inline">Cancelling...</span>
                    </>
                  ) : (
                    <>✕ <span className="hidden sm:inline">Yes, Cancel</span></>
                  )}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Reschedule Modal */}
        {showRescheduleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <Label>📅 Reschedule Booking</Label>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="p-2 sm:p-3 md:p-4 rounded-lg" style={{ background: G.mid }}>
                  <p className="text-[9px] sm:text-[10px] md:text-xs font-semibold mb-1 sm:mb-2" style={{ color: G.accent }}>Current Booking</p>
                  <p className="text-[10px] sm:text-xs md:text-sm break-words" style={{ color: G.text }}>{booking.date} at {booking.startTime}</p>
                </div>

                <div>
                  <p className="text-[10px] sm:text-xs md:text-sm font-semibold mb-1 sm:mb-2" style={{ color: G.text }}>Select New Date</p>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    disabled={rescheduling}
                    className="w-full px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg border text-[10px] sm:text-xs md:text-sm min-h-[44px]"
                    style={{ background: G.mid, borderColor: G.cardBorder, color: G.text }}
                  />
                </div>

                <div>
                  <p className="text-[10px] sm:text-xs md:text-sm font-semibold mb-1 sm:mb-2" style={{ color: G.text }}>Select New Time</p>
                  {loadingSlots ? (
                    <div className="text-center py-3 sm:py-4">
                      <p style={{ color: G.muted }} className="text-[10px] sm:text-xs md:text-sm">Loading available times...</p>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-3 sm:py-4">
                      <p style={{ color: G.muted }} className="text-[10px] sm:text-xs md:text-sm">No available slots for this date</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1 sm:gap-1.5 md:gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.hour}
                          onClick={() => setNewHour(slot.hour)}
                          disabled={!slot.available || rescheduling}
                          className={`py-1.5 sm:py-2 px-0.5 sm:px-1 md:px-2 rounded-lg border-2 transition-all text-[8px] sm:text-[10px] md:text-xs font-bold min-h-[40px] sm:min-h-[44px] flex flex-col items-center justify-center ${
                            newHour === slot.hour
                              ? 'border-opacity-100'
                              : 'border-opacity-50'
                          } ${!slot.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          style={{
                            backgroundColor: newHour === slot.hour ? G.bright : slot.available ? G.mid : G.dark,
                            borderColor: newHour === slot.hour ? G.lime : G.cardBorder,
                            color: G.text,
                          }}
                          title={!slot.available ? (slot.pendingCount > 0 ? `${slot.pendingCount} pending booking(s) - may become available if rejected` : 'This slot is booked') : 'Select this time'}
                        >
                          <div>{String(slot.hour).padStart(2, '0')}:00</div>
                          {slot.pendingCount > 0 && (
                            <div className="text-[7px] sm:text-[8px] md:text-[10px]" style={{ color: '#f0c040' }}>
                              ({slot.pendingCount})
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {newDate && newHour && (
                  <div className="p-2 sm:p-3 md:p-4 rounded-lg" style={{ background: G.bright }}>
                    <p className="text-[9px] sm:text-[10px] md:text-xs font-semibold mb-1 sm:mb-2" style={{ color: G.accent }}>New Booking</p>
                    <p className="text-[10px] sm:text-xs md:text-sm break-words" style={{ color: G.text }}>{newDate} at {String(newHour).padStart(2, '0')}:00</p>
                  </div>
                )}

                <div className="pt-2 sm:pt-3 border-t" style={{ borderColor: G.cardBorder }}>
                  <p className="text-[9px] sm:text-[10px] md:text-xs mb-2 sm:mb-3" style={{ color: G.muted }}>📝 After rescheduling, your booking status will be <strong>pending approval</strong> from the organization.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <button
                      onClick={() => {
                        setShowRescheduleModal(false);
                        setNewDate('');
                        setNewHour('');
                      }}
                      disabled={rescheduling}
                      className="py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 rounded-lg font-semibold text-[10px] sm:text-xs md:text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center"
                      style={{ background: G.mid, color: G.text }}
                    >
                      <span className="hidden sm:inline">✕ Cancel</span>
                      <span className="sm:hidden">Close</span>
                    </button>
                    <button
                      onClick={submitReschedule}
                      disabled={rescheduling || !newDate || !newHour}
                      className="py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 rounded-lg font-semibold text-[10px] sm:text-xs md:text-sm transition-all active:scale-95 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2 min-h-[44px]"
                      style={{ background: G.lime, color: G.dark }}
                      title={
                        rescheduling ? 'Rescheduling in progress...' :
                        !newDate ? 'Please select a date' :
                        !newHour ? 'Please select a time' :
                        'Reschedule your booking'
                      }
                    >
                      {rescheduling ? (
                        <>
                          <span className="animate-spin">⏳</span> <span className="hidden sm:inline">Rescheduling...</span>
                        </>
                      ) : (
                        <>✓ <span className="hidden sm:inline">Reschedule</span></>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
    </div>
  );
}
