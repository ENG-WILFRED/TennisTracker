'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

interface EventsSectionProps {
  orgId?: string;
}

interface ClubEvent {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  registrationCap: number;
  entryFee: number;
  _count?: { registrations: number };
}

export default function OrganizationEventsSection({ orgId }: EventsSectionProps) {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ClubEvent | null>(null);

  useEffect(() => {
    if (orgId) {
      fetchEvents();
    }
  }, [orgId]);

  async function fetchEvents() {
    if (!orgId) {
      setError('Organization ID is missing');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/organization/${orgId}/events`);
      if (!res.ok) throw new Error(`Failed to fetch events: ${res.status}`);
      const data = await res.json();
      setEvents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteEvent(eventId: string) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      const res = await fetch(`/api/organization/${orgId}/events/${eventId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete event');
      setEvents(events.filter(e => e.id !== eventId));
      alert('Event deleted successfully');
    } catch (err) {
      alert('Error deleting event: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }

  const getEventStatus = (startDate: string, endDate?: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;

    if (now < start) return 'Upcoming';
    if (now > end) return 'Completed';
    return 'Ongoing';
  };

  const registeredCount = (event: ClubEvent) => event._count?.registrations || 0;
  const totalRevenue = events.reduce((sum, e) => sum + (registeredCount(e) * e.entryFee), 0);

  if (error) {
    return <div style={{ color: 'red', padding: 12 }}>Error: {error}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Events Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>Total Events</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.lime, marginBottom: 6 }}>{loading ? '-' : events.length}</div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>Registrations</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.bright, marginBottom: 6 }}>{loading ? '-' : events.reduce((sum, e) => sum + registeredCount(e), 0)}</div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>Total Revenue</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.accent, marginBottom: 6 }}>${loading ? '-' : totalRevenue.toFixed(2)}</div>
        </div>
      </div>

      {/* Events List */}
      <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>🎾 Events Management</div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: G.muted }}>Loading events...</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: G.muted }}>No events found</div>
        ) : (
          events.map((event: ClubEvent, i: number) => {
            const registered = registeredCount(event);
            const status = getEventStatus(event.startDate, event.endDate);
            return (
              <div key={event.id} style={{ background: '#0f1f0f', borderRadius: 8, padding: '12px', marginBottom: i < events.length - 1 ? 8 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{event.name}</div>
                    <div style={{ fontSize: 9, color: G.muted, marginTop: 2 }}>📅 {new Date(event.startDate).toLocaleDateString()}</div>
                  </div>
                  <span style={{ fontSize: 9, padding: '4px 8px', background: G.lime + '33', color: G.lime, borderRadius: 4, fontWeight: 700 }}>
                    {status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: G.muted, marginBottom: 2 }}>Registrations</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 6, background: G.dark, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(registered / event.registrationCap) * 100}%`, background: G.lime, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 600, minWidth: 40, textAlign: 'right' }}>{registered}/{event.registrationCap}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 9, color: G.muted, marginBottom: 2 }}>Entry Fee</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: G.accent }}>${typeof event.entryFee === 'number' ? event.entryFee.toFixed(2) : '0.00'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Link href={`/organization/${orgId}/events/${event.id}`} style={{ flex: 1 }}>
                    <button style={{ width: '100%', padding: '6px', background: G.bright, color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
                      View Details
                    </button>
                  </Link>
                  <button
                    onClick={() => setSelectedEvent(event)}
                    style={{ flex: 1, padding: '6px', background: G.mid, color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    style={{ flex: 1, padding: '6px', background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
        <button style={{ width: '100%', marginTop: 12, padding: '8px', background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
          + Create New Event
        </button>
      </div>
    </div>
  );
}
