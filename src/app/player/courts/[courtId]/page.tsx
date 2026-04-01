'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authenticatedFetch } from '@/lib/authenticatedFetch';

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
  yellow: '#f0c040',
  red: '#ff6b6b',
};

interface Court {
  id: string;
  name: string;
  courtNumber: number;
  surface: string;
  indoorOutdoor: string;
  lights: boolean;
  status: string;
  organization?: { id: string; name: string };
}

interface CourtStats {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  revenue: number;
  averageRating?: number;
  totalComments: number;
}

interface Review {
  id: string;
  content: string;
  rating: number;
  createdAt: string;
  author: {
    user: { firstName: string; lastName: string; photo?: string };
  };
}

type TabId = 'overview' | 'availability' | 'reviews' | 'location' | 'statistics';

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'overview', icon: '📋', label: 'Overview' },
  { id: 'availability', icon: '📅', label: 'Availability' },
  { id: 'reviews', icon: '⭐', label: 'Reviews' },
  { id: 'location', icon: '📍', label: 'Location' },
  { id: 'statistics', icon: '📊', label: 'Statistics' },
];

export default function PlayerCourtDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { courtId } = params;

  const [court, setCourt] = useState<Court | null>(null);
  const [stats, setStats] = useState<CourtStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availability, setAvailability] = useState<any>(null);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [statisticsData, setStatisticsData] = useState<any>(null);

  useEffect(() => {
    if (courtId) {
      fetchCourtDetails();
    }
  }, [courtId]);

  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchReviews();
    }
  }, [activeTab, ratingFilter]);

  useEffect(() => {
    if (activeTab === 'availability') {
      fetchAvailability();
    }
  }, [activeTab, selectedDate]);

  useEffect(() => {
    if (activeTab === 'statistics') {
      fetchStatistics();
    }
  }, [activeTab]);

  async function fetchCourtDetails() {
    try {
      setLoading(true);
      const res = await authenticatedFetch(`/api/courts/${courtId}/details`);
      if (!res.ok) throw new Error('Failed to fetch court details');
      const data = await res.json();
      setCourt(data.court);
      setStats(data.stats);
      setReviews(data.comments);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading court details');
      toast.error('Failed to load court details');
    } finally {
      setLoading(false);
    }
  }

  async function fetchReviews() {
    try {
      const query = ratingFilter ? `?rating=${ratingFilter}` : '';
      const res = await authenticatedFetch(`/api/courts/${courtId}/reviews${query}`);
      if (!res.ok) throw new Error('Failed to fetch reviews');
      const data = await res.json();
      setReviews(data.reviews);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  }

  async function fetchAvailability() {
    try {
      const endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + 30);
      const query = `?startDate=${selectedDate}&endDate=${endDate.toISOString().split('T')[0]}`;
      const res = await authenticatedFetch(`/api/courts/${courtId}/availability${query}`);
      if (!res.ok) throw new Error('Failed to fetch availability');
      const data = await res.json();
      setAvailability(data);
    } catch (err) {
      console.error('Error fetching availability:', err);
    }
  }

  async function fetchStatistics() {
    try {
      const res = await authenticatedFetch(`/api/courts/${courtId}/statistics?period=30`);
      if (!res.ok) throw new Error('Failed to fetch statistics');
      const data = await res.json();
      setStatisticsData(data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  }

  const getStarRating = (rating: number) => {
    const full = Math.floor(rating);
    const partial = rating % 1 > 0.5 ? 1 : 0;
    return '★'.repeat(full + partial) + '☆'.repeat(5 - full - partial);
  };

  if (loading) {
    return (
      <div style={{ padding: 32, background: G.dark, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎾</div>
          <div style={{ color: G.muted, fontSize: 16, fontWeight: 600 }}>Loading court details…</div>
        </div>
      </div>
    );
  }

  if (error || !court) {
    return (
      <div style={{ padding: 32, background: G.dark, minHeight: '100vh' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'transparent', color: G.lime, border: 'none', fontSize: 14, cursor: 'pointer', marginBottom: 16, fontWeight: 700 }}
        >
          ← Back
        </button>
        <div style={{ color: G.red, fontSize: 16 }}>Error: {error || 'Court not found'}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px', background: G.dark, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          style={{ background: 'transparent', color: G.lime, border: 'none', fontSize: 14, cursor: 'pointer', marginBottom: 16, fontWeight: 700 }}
        >
          ← Back
        </button>

        {/* Hero Image */}
        <div style={{ marginBottom: 28, borderRadius: 16, overflow: 'hidden', height: 300, backgroundColor: G.card }}>
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: G.muted }}>
            🎾 Court Image
          </div>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16, marginBottom: 12 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 900, color: G.text, margin: 0 }}>
                {court.name}
              </h1>
              <div style={{ fontSize: 13, color: G.muted, marginTop: 4 }}>
                Court #{court.courtNumber} • {court.surface} • {court.indoorOutdoor}
                {court.organization && ` • ${court.organization.name}`}
              </div>
            </div>
            {stats && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: G.lime }}>
                  {stats.averageRating ? `${stats.averageRating.toFixed(1)}★` : 'N/A'}
                </div>
                <div style={{ fontSize: 11, color: G.muted }}>({stats.totalComments} reviews)</div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
          <StatCard label="Total Bookings" value={stats?.totalBookings || 0} />
          <StatCard label="Rating" value={stats?.averageRating ? stats.averageRating.toFixed(1) : 'N/A'} />
          <StatCard label="Confirmed" value={stats?.confirmedBookings || 0} />
          <StatCard label="Reviews" value={stats?.totalComments || 0} />
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: 24, borderBottom: `2px solid ${G.cardBorder}` }}>
          <div style={{ display: 'flex', gap: 0 }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 20px',
                  background: activeTab === tab.id ? G.mid : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? `3px solid ${G.lime}` : 'none',
                  color: activeTab === tab.id ? G.text : G.muted,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
            <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 16, color: G.text }}>Court Details</h3>
              <InfoRow label="Surface" value={court.surface} />
              <InfoRow label="Type" value={court.indoorOutdoor} />
              <InfoRow label="Lights" value={court.lights ? '✓ Yes' : '✗ No'} />
              <InfoRow label="Status" value={court.status} />
            </div>
          </div>
        )}

        {/* ── AVAILABILITY ── */}
        {activeTab === 'availability' && (
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 16, color: G.text }}>Check Availability</h3>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{
                padding: '8px 12px',
                background: G.dark,
                border: `1px solid ${G.cardBorder}`,
                borderRadius: 6,
                color: G.text,
                marginBottom: 16,
              }}
            />
            {availability && (
              <div>
                {availability.availability.map((day: any) => (
                  <div
                    key={day.date}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: `1px solid ${G.cardBorder}22`,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: G.text }}>
                        {day.dayOfWeek}, {new Date(day.date).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>
                        {day.isAvailable ? `${day.bookings.length} bookings` : 'Closed'}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        padding: '4px 12px',
                        background: day.isAvailable ? G.lime + '22' : G.red + '22',
                        color: day.isAvailable ? G.lime : G.red,
                        borderRadius: 4,
                        fontWeight: 600,
                      }}
                    >
                      {day.isAvailable ? 'Available' : 'Closed'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── REVIEWS ── */}
        {activeTab === 'reviews' && (
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 16, color: G.text }}>
              Reviews ({reviews.length})
            </h3>
            {reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: G.muted }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>⭐</div>
                <div>No reviews yet</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {reviews.map(review => (
                  <div
                    key={review.id}
                    style={{
                      background: G.dark,
                      border: `1px solid ${G.cardBorder}22`,
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: G.text }}>
                          {review.author.user.firstName} {review.author.user.lastName}
                        </div>
                        <div style={{ fontSize: 11, color: G.yellow }}>
                          {getStarRating(review.rating)}
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: G.muted }}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: G.text, margin: 0 }}>{review.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── LOCATION ── */}
        {activeTab === 'location' && (
          <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 16, color: G.text }}>Location</h3>
            <div style={{ textAlign: 'center', padding: '40px 20px', color: G.muted }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📍</div>
              <div>Location information not available</div>
            </div>
          </div>
        )}

        {/* ── STATISTICS ── */}
        {activeTab === 'statistics' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            {statisticsData?.stats && (
              <>
                <StatCard label="Total Bookings" value={statisticsData.stats.totalBookings} />
                <StatCard label="Total Hours" value={statisticsData.stats.totalHoursBooked} />
                <StatCard label="Utilization" value={`${statisticsData.stats.utilizationRate}%`} />
                <StatCard label="Peak Bookings" value={statisticsData.stats.peakBookings} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard: React.FC<{ label: string; value: any; color?: string }> = ({
  label,
  value,
  color = G.lime,
}) => (
  <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 16 }}>
    <div style={{ fontSize: 11, color: G.muted, marginBottom: 8, fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
  </div>
);

const InfoRow: React.FC<{ label: string; value: any }> = ({ label, value }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ fontSize: 11, color: G.muted, fontWeight: 600, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 13, color: G.text, fontWeight: 600 }}>{value}</div>
  </div>
);

const Badge: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <span
    style={{
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 600,
      color,
      background: color + '22',
      border: `1px solid ${color}55`,
    }}
  >
    {label}
  </span>
);
