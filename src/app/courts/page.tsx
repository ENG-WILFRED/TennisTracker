'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createCourtBooking, getPlayerBookings } from '@/actions/bookings';

interface Court {
  id: string;
  name: string;
  surface: string;
  indoorOutdoor: string;
  lights: boolean;
  status: string;
  organization: {
    id: string;
    name: string;
    city: string;
    country: string;
    rating: number;
    logo: string;
    address: string;
  };
  bookings: any[];
}

export default function CourtsPage() {
  const searchParams = useSearchParams();
  
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Booking & Checkout states
  const { user: authUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [playerBookings, setPlayerBookings] = useState<any[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [checkoutStage, setCheckoutStage] = useState<'booking' | 'payment' | 'receipt'>('booking');
  const [bookingId, setBookingId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mpesa'>('card');
  const [actionLoading, setActionLoading] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    surface: searchParams.get('surface') || '',
    indoorOutdoor: searchParams.get('indoorOutdoor') || '',
    city: searchParams.get('city') || '',
    hasLights: searchParams.get('hasLights') || '',
  });

  const [organizations, setOrganizations] = useState<any[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  // Load courts on mount and when filters change
  useEffect(() => {
    const loadCourts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filters.surface) params.append('surface', filters.surface);
        if (filters.indoorOutdoor) params.append('indoorOutdoor', filters.indoorOutdoor);
        if (filters.city) params.append('city', filters.city);
        if (filters.hasLights) params.append('hasLights', filters.hasLights);

        const response = await fetch(`/api/courts/search?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to load courts');
        
        const data = await response.json();
        setCourts(data.courts);

        // Extract unique cities and organizations
        const uniqueCities = [...new Set(data.courts.map((c: Court) => c.organization.city))];
        setCities(uniqueCities as string[]);
        
        const uniqueOrgs = [...new Map(data.courts.map((c: Court) => [c.organization.id, c.organization])).values()];
        setOrganizations(uniqueOrgs);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCourts();
  }, [filters]);

  useEffect(() => {
    const loadTimes = async () => {
      if (!selectedCourt || !selectedDate) {
        setAvailableSlots([]);
        return;
      }

      try {
        const response = await fetch('/api/courts/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courtId: selectedCourt.id, date: selectedDate }),
        });

        if (!response.ok) {
          throw new Error('Failed to load time slots');
        }

        const data = await response.json();
        setAvailableSlots(data.slots || []);
      } catch (err: any) {
        console.error('Time slot load error', err);
        setAvailableSlots([]);
      }
    };

    loadTimes();
  }, [selectedCourt, selectedDate]);

  useEffect(() => {
    const loadPlayerHistory = async () => {
      if (!authUser || !selectedCourt) {
        setPlayerBookings([]);
        return;
      }

      try {
        const bookings = await getPlayerBookings(authUser.id, selectedCourt.organization.id);
        setPlayerBookings(bookings);
      } catch (error) {
        console.error('Player booking history load failed:', error);
        setPlayerBookings([]);
      }
    };

    loadPlayerHistory();
  }, [authUser, selectedCourt]);

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: prev[filterName as keyof typeof filters] === value ? '' : value,
    }));
  };

  const getSurfaceIcon = (surface: string): string => {
    switch (surface) {
      case 'Clay': return '🧱';
      case 'Hard': return '⚫';
      case 'Grass': return '🌱';
      default: return '⚪';
    }
  };

  const getUpcomingBookings = (court: Court) => {
    const now = new Date();
    return court.bookings.filter(b => new Date(b.startTime) > now).length;
  };

  const handleBookNow = () => {
    setCheckoutStage('payment');
  };

  const handlePaymentConfirm = async () => {
    if (!authUser) {
      alert('Please sign in to complete booking');
      return;
    }

    if (!selectedCourt || !selectedSlot) {
      alert('Please select a valid slot first');
      return;
    }

    setActionLoading(true);

    try {
      const startTime = new Date(`${selectedDate}T${selectedSlot.time}:00`);
      const endHour = Number(selectedSlot.time.slice(0, 2)) + 1;
      const endTime = new Date(startTime);
      endTime.setHours(endHour, 0, 0, 0);

      const booking = await createCourtBooking(
        authUser.id,
        selectedCourt.id,
        startTime.toISOString(),
        endTime.toISOString(),
        selectedCourt.organization.id
      );

      setBookingId(booking.booking.id);
      setPlayerBookings((prev) => [booking.booking, ...prev]);
      setCheckoutStage('receipt');

      // keep display values and totalPrice from selected slot
      setSelectedTime(`${selectedSlot.time} - ${String(endHour).padStart(2, '0')}:00`);
      setTotalPrice(selectedSlot.price);
    } catch (error: any) {
      alert(error?.message || 'Booking failed, please try again');
      console.error('Payment/booking error', error);
    } finally {
      setActionLoading(false);
    }
  };

  const resetBooking = () => {
    setShowDetails(false);
    setCheckoutStage('booking');
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setSelectedTime('');
    setSelectedSlot(null);
    setAvailableSlots([]);
    setTotalPrice(0);
    setBookingId('');
    setPaymentMethod('card');
  };

  return (
    <div className="min-h-screen bg-vico-dark text-vico-textPrimary p-5">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2 text-vico-primary">
          🎾 Discover Tennis Courts
        </h1>
        <p className="text-base text-vico-textMuted">
          Find and book courts across all our partner facilities
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar - Filters */}
        <aside className="bg-vico-surfaceSecondary rounded-xl p-6 border border-vico-primary shadow-card h-fit lg:sticky lg:top-5">
          <h2 className="text-base font-bold mb-5 text-vico-textPrimary uppercase">
            🔍 FILTERS
          </h2>

          {/* Court Surface Filter */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-vico-accent mb-2 uppercase tracking-wide">
              Court Surface
            </label>
            {['Clay', 'Hard', 'Grass'].map((surface) => (
              <button
                key={surface}
                onClick={() => handleFilterChange('surface', surface)}
                className={`flex items-center gap-2 w-full px-3 py-2 mb-1.5 rounded transition-all ${
                  filters.surface === surface
                    ? `bg-vico-surfaceTertiary border border-vico-primary text-vico-textPrimary`
                    : 'bg-transparent border border-vico-border text-vico-textPrimary hover:border-vico-primary'
                }`}
              >
                <span>{getSurfaceIcon(surface)}</span>
                <span>{surface}</span>
              </button>
            ))}
          </div>

          {/* Indoor/Outdoor Filter */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-vico-accent mb-2 uppercase tracking-wide">
              Location Type
            </label>
            {[
              { value: 'indoor', label: '🏠 Indoor' },
              { value: 'outdoor', label: '☀️ Outdoor' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleFilterChange('indoorOutdoor', value)}
                className={`flex items-center gap-2 w-full px-3 py-2 mb-1.5 rounded transition-all ${
                  filters.indoorOutdoor === value
                    ? `bg-vico-surfaceTertiary border border-vico-primary text-vico-textPrimary`
                    : 'bg-transparent border border-vico-border text-vico-textPrimary hover:border-vico-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* City Filter */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-vico-accent mb-2 uppercase tracking-wide">
              City
            </label>
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => handleFilterChange('city', city)}
                className={`block w-full px-3 py-2 mb-1.5 rounded text-left text-sm transition-all ${
                  filters.city === city
                    ? `bg-vico-surfaceTertiary border border-vico-primary text-vico-textPrimary`
                    : 'bg-transparent border border-vico-border text-vico-textPrimary hover:border-vico-primary'
                }`}
              >
                📍 {city}
              </button>
            ))}
          </div>

          {/* Lights Filter */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-vico-accent mb-2 uppercase tracking-wide">
              Lighting
            </label>
            <button
              onClick={() => handleFilterChange('hasLights', 'true')}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded transition-all ${
                filters.hasLights === 'true'
                  ? `bg-vico-surfaceTertiary border border-vico-primary text-vico-textPrimary`
                  : 'bg-transparent border border-vico-border text-vico-textPrimary hover:border-vico-primary'
              }`}
            >
              💡 Has Lights
            </button>
          </div>

          {/* Reset Filters */}
          {(filters.surface || filters.indoorOutdoor || filters.city || filters.hasLights) && (
            <button
              onClick={() => setFilters({ surface: '', indoorOutdoor: '', city: '', hasLights: '' })}
              className="w-full px-3 py-2 bg-vico-surfaceTertiary border border-vico-border rounded text-vico-primary font-bold text-sm transition-all hover:border-vico-primary"
            >
              ✕ Clear Filters
            </button>
          )}
        </aside>

        {/* Main Content - Courts Grid */}
        <main className="mt-10">
          {loading ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">⏳</div>
              <p className="text-vico-textMuted">Loading courts...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">❌</div>
              <p className="text-vico-danger">{error}</p>
            </div>
          ) : courts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🏜️</div>
              <p className="text-base font-bold text-vico-textPrimary mb-2">
                No courts found
              </p>
              <p className="text-vico-textMuted">Try adjusting your filters</p>
            </div>
          ) : (
            <div>
              <div className="mb-5">
                <p className="text-sm text-vico-textMuted">
                  Found <strong className="text-vico-primary">{courts.length}</strong> courts
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courts.map((court) => (
                  <div
                    key={court.id}
                    onClick={() => {
                      setSelectedCourt(court);
                      setShowDetails(true);
                    }}
                    className="group bg-vico-surfaceTertiary border-2 border-vico-primary ring-1 ring-vico-primary/25 rounded-[32px] p-6 cursor-pointer transition-all duration-300 hover:shadow-modal hover:border-vico-primary hover:-translate-y-1"
                  >
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-vico-surface/70 px-3 py-1 text-xs font-semibold text-vico-textPrimary">
                      <span className="h-2.5 w-2.5 rounded-full bg-vico-primary" />
                      Court details
                    </div>

                    {/* Court Name */}
                    <h3 className="text-lg font-bold text-vico-primary mb-2 tracking-tight">
                      {getSurfaceIcon(court.surface)} {court.name}
                    </h3>

                    {/* Organization */}
                    <div className="mb-4">
                      <div className="text-sm font-semibold text-vico-textPrimary mb-1">
                        {court.organization.name}
                      </div>
                      <div className="text-xs text-vico-textMuted">
                        📍 {court.organization.city}, {court.organization.country}
                      </div>
                    </div>

                    {/* Court Details */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-vico-surface rounded-3xl p-3 border border-vico-primary shadow-dropdown">
                        <div className="text-[11px] text-vico-textMuted mb-2 uppercase tracking-[0.20em]">
                          Type
                        </div>
                        <div className="text-sm text-vico-textPrimary font-semibold">
                          {court.indoorOutdoor === 'indoor' ? '🏠' : '☀️'} {court.indoorOutdoor}
                        </div>
                      </div>
                      <div className="bg-vico-surface rounded-3xl p-3 border border-vico-primary shadow-dropdown">
                        <div className="text-[11px] text-vico-textMuted mb-2 uppercase tracking-[0.20em]">
                          Lights
                        </div>
                        <div className={`text-sm font-semibold ${court.lights ? 'text-vico-warning' : 'text-vico-textMuted'}`}>
                          {court.lights ? '💡 Yes' : '❌ No'}
                        </div>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="text-xs text-vico-textMuted mb-4">
                      ⭐ {court.organization.rating} reviews
                    </div>

                    {/* Upcoming Bookings */}
                    <div className="bg-vico-surface rounded-3xl p-4 text-center border border-vico-primary shadow-dropdown">
                      <div className="text-xs font-semibold text-vico-textPrimary">
                        {getUpcomingBookings(court)} upcoming bookings
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Player Booking History */}
      {authUser && (
        <section className="mt-10 p-6 bg-vico-surfaceSecondary rounded-2xl border border-vico-primary shadow-card">
          <h2 className="text-xl font-bold text-vico-textPrimary mb-3">📜 My Court Booking History</h2>
          {playerBookings.length === 0 ? (
            <p className="text-sm text-vico-textMuted">No bookings yet. Book a slot to create history.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {playerBookings.slice(0, 6).map((booking) => (
                <div key={booking.id} className="bg-vico-surfaceSecondary p-4 rounded-2xl border border-vico-primary shadow-card">
                  <p className="text-sm font-semibold text-vico-textPrimary">{booking.court?.name || 'Court Booking'}</p>
                  <p className="text-xs text-vico-textMuted">{new Date(booking.startTime).toLocaleDateString()} {new Date(booking.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(booking.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                  <p className="text-xs text-vico-primary font-bold">${booking.price}</p>
                  <p className="text-xs uppercase tracking-wide text-vico-textMuted mt-1">{booking.status}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Booking/Checkout Modal */}
      {showDetails && selectedCourt && (
        <div
          onClick={() => resetBooking()}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-vico-surfaceSecondary border border-vico-primary rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-modal"
          >
            {/* STAGE 1: Booking Details */}
            {checkoutStage === 'booking' && (
              <>
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h2 className="text-xl font-bold text-vico-primary mb-1">
                      {getSurfaceIcon(selectedCourt.surface)} {selectedCourt.name}
                    </h2>
                    <p className="text-sm text-vico-textMuted">
                      {selectedCourt.organization.name}
                    </p>
                  </div>
                  <button
                    onClick={() => resetBooking()}
                    className="bg-transparent border-none text-vico-textMuted text-2xl cursor-pointer hover:text-vico-primary transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Organization Details */}
                <div className="bg-vico-surfaceSecondary rounded-2xl p-5 mb-5 border border-vico-primary shadow-card">
                  <div className="text-base font-semibold text-vico-textPrimary mb-2">
                    {selectedCourt.organization.name}
                  </div>
                  <p className="text-xs text-vico-textMuted mb-2">
                    📍 {selectedCourt.organization.city}, {selectedCourt.organization.country}
                  </p>
                  <div className="text-sm text-vico-warning font-semibold">
                    ⭐ {selectedCourt.organization.rating} rating
                  </div>
                </div>

                {/* Date Selector */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-vico-accent mb-2 uppercase">
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-3 rounded-lg border border-vico-primary bg-vico-surface text-vico-textPrimary"
                  />
                </div>

                {/* Court Specs */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-vico-surface rounded-2xl p-3 border border-vico-primary">
                    <div className="text-xs text-vico-textMuted mb-1 uppercase">Surface</div>
                    <div className="text-sm text-vico-textPrimary font-semibold">{selectedCourt.surface}</div>
                  </div>
                  <div className="bg-vico-surface rounded-2xl p-3 border border-vico-primary">
                    <div className="text-xs text-vico-textMuted mb-1 uppercase">Type</div>
                    <div className="text-sm text-vico-textPrimary font-semibold">
                      {selectedCourt.indoorOutdoor === 'indoor' ? '🏠 Indoor' : '☀️ Outdoor'}
                    </div>
                  </div>
                  <div className="bg-vico-surface rounded-2xl p-3 border border-vico-primary">
                    <div className="text-xs text-vico-textMuted mb-1 uppercase">Lights</div>
                    <div className={`text-sm font-semibold ${selectedCourt.lights ? 'text-vico-warning' : 'text-vico-textMuted'}`}>
                      {selectedCourt.lights ? '💡 Yes' : '❌ No'}
                    </div>
                  </div>
                  <div className="bg-vico-surface rounded-2xl p-3 border border-vico-primary">
                    <div className="text-xs text-vico-textMuted mb-1 uppercase">Status</div>
                    <div className="text-sm text-vico-primary font-semibold">✓ Available</div>
                  </div>
                </div>

                {/* Available Time Slots */}
                <div className="mb-5">
                  <h3 className="text-sm font-bold text-vico-accent mb-3 uppercase">
                    📅 AVAILABLE TIME SLOTS
                  </h3>
                  {availableSlots.length === 0 ? (
                    <p className="text-xs text-vico-textMuted">No slots available yet for {selectedDate || 'selected date'}.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => {
                            if (!slot.available) return;
                            setSelectedTime(`${slot.time} - ${String(Number(slot.time.slice(0, 2)) + 1).padStart(2, '0')}:00`);
                            setTotalPrice(slot.price);
                            setSelectedSlot(slot);
                          }}
                          className={`w-full rounded-2xl p-3 text-left border transition-all ${slot.available ? 'bg-vico-surface border-vico-primary hover:border-vico-primaryHover' : 'bg-transparent border-vico-primary opacity-60 cursor-not-allowed'} ${selectedSlot?.time === slot.time ? 'border-vico-primaryHover bg-vico-surfaceSecondary' : ''}`}
                        >
                          <div className="text-vico-textPrimary font-semibold mb-1">
                            {slot.time} - {String(Number(slot.time.slice(0, 2)) + 1).padStart(2, '0')}:00
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-vico-textMuted">{slot.isPeak ? '🔥 Peak Hours' : '⏰ Standard'}</span>
                            <span className="text-vico-primary font-semibold">${slot.price}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleBookNow}
                  disabled={!selectedSlot}
                  className={`w-full px-3 py-3 mb-3 ${!selectedSlot ? 'bg-vico-surface text-vico-textMuted cursor-not-allowed' : 'bg-vico-primary text-vico-dark hover:opacity-95'} border-none rounded font-bold text-sm transition-all`}
                >
                  {selectedSlot ? 'Proceed to Payment' : 'Select a slot to continue'}
                </button>

                <button
                  onClick={() => resetBooking()}
                  className="w-full px-3 py-3 bg-vico-primary border-none rounded text-vico-dark font-bold text-sm cursor-pointer transition-all hover:opacity-95"
                >
                  Close
                </button>
              </>
            )}

            {/* STAGE 2: Payment */}
            {checkoutStage === 'payment' && (
              <>
                <div className="mb-5">
                  <button
                    onClick={() => setCheckoutStage('booking')}
                    className="text-vico-primary text-sm mb-3 hover:underline"
                  >
                    ← Back
                  </button>
                  <h2 className="text-2xl font-bold text-vico-primary mb-2">
                    💳 Payment
                  </h2>
                  <p className="text-sm text-vico-textMuted">
                    Book: {selectedCourt.name}
                  </p>
                </div>

                {/* Booking Summary */}
                <div className="bg-vico-surfaceSecondary rounded-2xl p-4 mb-5 border border-vico-primary shadow-card">
                  <div className="mb-3">
                    <p className="text-xs text-vico-textMuted mb-1">Date</p>
                    <p className="text-base font-semibold text-vico-textPrimary">📅 {selectedDate}</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-xs text-vico-textMuted mb-1">Time</p>
                    <p className="text-base font-semibold text-vico-textPrimary">⏰ {selectedTime}</p>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-vico-dark rounded-2xl p-4 mb-5 border border-vico-primary">
                  <div className="flex justify-between mb-3 pb-3 border-b border-vico-primary">
                    <span className="text-vico-textMuted">Total Price</span>
                    <span className="text-vico-primary font-bold text-lg">${totalPrice.toFixed(2)}</span>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-xs text-vico-accent font-bold mb-2 uppercase">Payment Plan</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-vico-surface border border-vico-primary p-3 rounded-2xl">
                        <div>
                          <p className="text-sm text-vico-textPrimary font-semibold">Pay Now</p>
                          <p className="text-xs text-vico-textMuted">50% of total</p>
                        </div>
                        <p className="text-vico-primary font-bold">${(totalPrice / 2).toFixed(2)}</p>
                      </div>
                      <div className="flex justify-between items-center bg-vico-surface border border-vico-primary p-3 rounded-2xl">
                        <div>
                          <p className="text-sm text-vico-textPrimary font-semibold">Pay Later</p>
                          <p className="text-xs text-vico-textMuted">Due on visit</p>
                        </div>
                        <p className="text-vico-warning font-bold">${(totalPrice / 2).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-5">
                  <p className="text-xs text-vico-accent font-bold mb-3 uppercase">Payment Method</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`w-full p-3 rounded border transition-all text-left ${
                        paymentMethod === 'card'
                          ? 'bg-vico-surface border-vico-primary'
                          : 'bg-transparent border-vico-primary hover:border-vico-primaryHover'
                      }`}
                    >
                      <p className="text-sm font-semibold text-vico-textPrimary">💳 Credit/Debit Card</p>
                      <p className="text-xs text-vico-textMuted">Visa, Mastercard, Amex</p>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('mpesa')}
                      className={`w-full p-3 rounded border transition-all text-left ${
                        paymentMethod === 'mpesa'
                          ? 'bg-vico-surface border-vico-primary'
                          : 'bg-transparent border-vico-primary hover:border-vico-primaryHover'
                      }`}
                    >
                      <p className="text-sm font-semibold text-vico-textPrimary">📱 M-Pesa</p>
                      <p className="text-xs text-vico-textMuted">Mobile Money</p>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handlePaymentConfirm}
                  disabled={actionLoading || !selectedSlot}
                  className={`w-full px-3 py-3 bg-vico-primary border-none rounded font-bold text-sm cursor-pointer transition-all text-vico-dark ${actionLoading || !selectedSlot ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-95'}`}
                >
                  {actionLoading ? 'Processing payment…' : `Confirm Payment $${(totalPrice / 2).toFixed(2)}`}
                </button>
              </>
            )}

            {/* STAGE 3: Receipt & Entrance Card */}
            {checkoutStage === 'receipt' && (
              <>
                <div className="text-center mb-6 bg-vico-surfaceSecondary border border-vico-primary rounded-2xl p-6">
                  <div className="text-5xl mb-3">✅</div>
                  <h2 className="text-2xl font-bold text-vico-primary mb-1">
                    Booking Confirmed!
                  </h2>
                  <p className="text-sm text-vico-textMuted">
                    Your court is reserved
                  </p>
                </div>

                {/* Receipt */}
                <div className="bg-vico-surfaceSecondary rounded-2xl p-4 mb-5 border border-vico-primary">
                  <div className="text-center mb-4 pb-4 border-b border-vico-primary">
                    <p className="text-xs text-vico-textMuted uppercase mb-1">Receipt</p>
                    <p className="text-sm font-bold text-vico-textPrimary">#{bookingId.slice(0, 8).toUpperCase()}</p>
                  </div>

                  <div className="space-y-3 mb-4 pb-4 border-b border-vico-primary">
                    <div className="flex justify-between text-sm">
                      <span className="text-vico-textMuted">Court</span>
                      <span className="text-vico-textPrimary font-semibold">{selectedCourt.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-vico-textMuted">Date</span>
                      <span className="text-vico-textPrimary font-semibold">{selectedDate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-vico-textMuted">Time</span>
                      <span className="text-vico-textPrimary font-semibold">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-vico-textMuted">Organization</span>
                      <span className="text-vico-textPrimary font-semibold text-right max-w-[150px]">{selectedCourt.organization.name}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-base font-bold">
                      <span className="text-vico-textMuted">Total</span>
                      <span className="text-vico-primary">${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-vico-warning">Paid Now</span>
                      <span className="text-vico-warning font-semibold">${(totalPrice / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-vico-accent">Balance Due</span>
                      <span className="text-vico-accent font-semibold">${(totalPrice / 2).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Entrance Card */}
                <div className="bg-gradient-to-br from-vico-primary to-vico-accent rounded-lg p-4 mb-5 text-vico-dark">
                  <div className="text-center mb-3">
                    <p className="text-xs font-bold opacity-75 uppercase">Entrance Card</p>
                    <p className="text-xl font-black">🎾</p>
                  </div>
                  
                  <div className="bg-white/20 rounded p-3 mb-3 text-center">
                    <p className="text-xs font-bold mb-1">BOOKING ID</p>
                    <p className="text-lg font-black tracking-wider">{bookingId.slice(0, 8).toUpperCase()}</p>
                  </div>

                  <div className="text-center text-xs space-y-1">
                    <p><strong>{selectedCourt.name}</strong></p>
                    <p>{selectedDate} {selectedTime}</p>
                    <p className="font-bold">{selectedCourt.organization.name}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => window.print()}
                    className="w-full px-3 py-3 bg-vico-surface border border-vico-primary rounded font-bold text-sm cursor-pointer transition-all hover:bg-vico-surfaceSecondary text-vico-textPrimary"
                  >
                    🖨️ Print Receipt
                  </button>
                  <button
                    onClick={() => resetBooking()}
                    className="w-full px-3 py-3 bg-vico-primary border-none rounded text-vico-dark font-bold text-sm cursor-pointer transition-all hover:opacity-95"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
