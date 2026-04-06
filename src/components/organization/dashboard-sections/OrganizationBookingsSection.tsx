'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

interface BookingsSectionProps {
  orgId?: string;
}

interface CourtBooking {
  id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'rejected';
  startTime: string;
  endTime: string;
  price: number | null;
  court: { id: string; name: string; courtNumber: number; surface: string };
  member: {
    id: string;
    player: { user: { firstName: string; lastName: string; email: string; phone: string } };
  };
  rejectionReason?: string;
  notes?: string;
}

export default function OrganizationBookingsSection({ orgId }: BookingsSectionProps) {
  const [bookings, setBookings] = useState<CourtBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<CourtBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'rejected'>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionBookingId, setRejectionBookingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (orgId) {
      fetchBookings();
    }
  }, [orgId, selectedDate]);

  useEffect(() => {
    filterBookings();
  }, [bookings, filterStatus]);

  async function fetchBookings() {
    if (!orgId) {
      setError('Organization ID is missing');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await authenticatedFetch(`/api/organization/${orgId}/bookings?date=${selectedDate}`);
      if (!res.ok) throw new Error(`Failed to fetch bookings: ${res.status}`);
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  }

  function filterBookings() {
    if (filterStatus === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(b => b.status === filterStatus));
    }
  }

  async function handleBookingAction(bookingId: string, newStatus: 'confirmed' | 'cancelled' | 'rejected', reason?: string) {
    setUpdatingId(bookingId);
    try {
      const body: any = { status: newStatus };
      if (newStatus === 'rejected' && reason) {
        body.rejectionReason = reason;
      }

      const res = await authenticatedFetch(`/api/organization/${orgId}/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to update booking');
      
      const updatedBooking = await res.json();
      setBookings(bookings.map(b => 
        b.id === bookingId ? updatedBooking : b
      ));
      
      toast.success(`Booking ${newStatus === 'confirmed' ? 'confirmed' : newStatus === 'rejected' ? 'rejected' : 'cancelled'} successfully`);
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error updating booking');
    } finally {
      setUpdatingId(null);
    }
  }

  const handleRejectClick = (bookingId: string) => {
    setRejectionBookingId(bookingId);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = () => {
    if (!rejectionBookingId || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    handleBookingAction(rejectionBookingId, 'rejected', rejectionReason);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return G.lime;
      case 'pending': return G.yellow;
      case 'cancelled': return '#ff6b6b';
      case 'rejected': return '#ff6b6b';
      default: return G.muted;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'confirmed': return G.lime + '22';
      case 'pending': return G.yellow + '22';
      case 'cancelled': return '#ff6b6b22';
      case 'rejected': return '#ff6b6b22';
      default: return G.muted + '22';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (error) {
    return <div style={{ color: '#ff6b6b', padding: 12 }}>Error: {error}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Bookings Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {[
          { label: 'Total', value: bookings.length, color: G.accent },
          { label: 'Pending', value: bookings.filter(b => b.status === 'pending').length, color: G.yellow },
          { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, color: G.lime },
          { label: 'Rejected', value: bookings.filter(b => b.status === 'rejected').length, color: '#ff6b6b' },
          { label: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length, color: '#ff6b6b' },
        ].map(stat => (
          <div key={stat.label} style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>{stat.label}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: stat.color }}>{loading ? '-' : stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters and Date Picker */}
      <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['all', 'pending', 'confirmed', 'rejected', 'cancelled'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: '6px 12px',
                background: filterStatus === status ? G.lime : G.dark,
                color: filterStatus === status ? '#0f1f0f' : G.muted,
                border: `1px solid ${filterStatus === status ? G.lime : G.cardBorder}`,
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s',
              }}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          style={{
            marginLeft: 'auto',
            padding: '6px 10px',
            background: G.dark,
            border: `1px solid ${G.cardBorder}`,
            borderRadius: 6,
            color: G.text,
            fontSize: 11,
          }}
        />
      </div>

      {/* Bookings List */}
      <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>🎾 Court Bookings</div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: G.muted }}>Loading bookings...</div>
        ) : filteredBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: G.muted }}>No bookings found</div>
        ) : (
          filteredBookings.map((booking, i) => (
            <div
              key={booking.id}
              style={{
                background: '#0f1f0f',
                borderRadius: 8,
                padding: 12,
                marginBottom: i < filteredBookings.length - 1 ? 8 : 0,
                borderLeft: `3px solid ${getStatusColor(booking.status)}`,
              }}
            >
              {/* Header Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>
                    {booking.member?.player?.user?.firstName} {booking.member?.player?.user?.lastName}
                  </div>
                  <div style={{ fontSize: 9, color: G.muted, marginTop: 2 }}>
                    📧 {booking.member?.player?.user?.email}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 9,
                    padding: '4px 10px',
                    background: getStatusBg(booking.status),
                    color: getStatusColor(booking.status),
                    borderRadius: 4,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  {booking.status}
                </span>
              </div>

              {/* Booking Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 9, color: G.muted, marginBottom: 2 }}>🎾 Court</div>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{booking.court?.name}</div>
                  <div style={{ fontSize: 9, color: G.muted, marginTop: 1 }}>Surface: {booking.court?.surface}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: G.muted, marginBottom: 2 }}>📅 Date & Time</div>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{formatDate(booking.startTime)}</div>
                  <div style={{ fontSize: 9, color: G.muted, marginTop: 1 }}>
                    {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                  </div>
                </div>
              </div>

              {/* Price */}
              {booking.price && (
                <div style={{ fontSize: 11, fontWeight: 600, color: G.accent, marginBottom: 10 }}>
                  💰 ${booking.price.toFixed(2)}
                </div>
              )}

              {/* Notes */}
              <div style={{ fontSize: 10, color: G.muted, marginBottom: 10, padding: 8, background: G.mid, borderRadius: 4 }}>
                <strong>📝 Notes:</strong> {booking.notes || 'No additional notes'}
              </div>

              {/* Rejection Reason (if rejected) */}
              {booking.status === 'rejected' && booking.rejectionReason && (
                <div style={{ fontSize: 10, color: '#ff6b6b', marginBottom: 10, padding: 8, background: '#ff6b6b22', borderRadius: 4 }}>
                  <strong>Rejection Reason:</strong> {booking.rejectionReason}
                </div>
              )}

              {/* Action Buttons */}
              {booking.status === 'pending' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleBookingAction(booking.id, 'confirmed')}
                    disabled={updatingId === booking.id}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      background: G.lime,
                      color: '#0f1f0f',
                      border: 'none',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: updatingId === booking.id ? 'not-allowed' : 'pointer',
                      opacity: updatingId === booking.id ? 0.6 : 1,
                    }}
                  >
                    {updatingId === booking.id ? '⏳' : '✓ Confirm'}
                  </button>
                  <button
                    onClick={() => handleRejectClick(booking.id)}
                    disabled={updatingId === booking.id}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      background: '#ff6b6b',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: updatingId === booking.id ? 'not-allowed' : 'pointer',
                      opacity: updatingId === booking.id ? 0.6 : 1,
                    }}
                  >
                    {updatingId === booking.id ? '⏳' : '✗ Reject'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
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
          onClick={() => setShowRejectModal(false)}
        >
          <div
            style={{
              background: G.card,
              border: `1px solid ${G.cardBorder}`,
              borderRadius: 12,
              padding: 20,
              maxWidth: 400,
              width: '90%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#ff6b6b' }}>
              ⚠️ Reject Booking
            </h2>
            <p style={{ fontSize: 12, color: G.muted, marginBottom: 16 }}>
              Please provide a reason for rejecting this booking. This will be visible to the player.
            </p>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason (e.g., Court maintenance, Overbooking, etc.)"
              style={{
                width: '100%',
                minHeight: 80,
                padding: 10,
                background: G.dark,
                border: `1px solid ${G.cardBorder}`,
                borderRadius: 6,
                color: G.text,
                fontSize: 12,
                fontFamily: 'inherit',
                resize: 'vertical',
                marginBottom: 16,
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowRejectModal(false)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: G.mid,
                  color: G.text,
                  border: `1px solid ${G.cardBorder}`,
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectionReason.trim() || updatingId === rejectionBookingId}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: '#ff6b6b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: !rejectionReason.trim() || updatingId === rejectionBookingId ? 'not-allowed' : 'pointer',
                  opacity: !rejectionReason.trim() || updatingId === rejectionBookingId ? 0.6 : 1,
                }}
              >
                {updatingId === rejectionBookingId ? '⏳ Rejecting...' : '✗ Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
