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

interface OrgEventItem {
  id: string;
  name: string;
  description?: string;
  eventType: string;
  startDate: string;
  endDate?: string;
  registrationCap: number;
  entryFee: number;
  location?: string;
  _count?: { registrations: number };
  bookingsCount?: number;
  type: 'event' | 'session';
}

export default function OrganizationEventsSection({ orgId }: EventsSectionProps) {
  const [events, setEvents] = useState<OrgEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<OrgEventItem | null>(null);

  useEffect(() => {
    if (orgId) {
      loadItems();
    }
  }, [orgId]);

  async function fetchEvents() {
    const res = await fetch(`/api/organization/${orgId}/events`);
    if (!res.ok) throw new Error(`Failed to fetch events: ${res.status}`);
    const data = await res.json();
    return (data || []).map((e: any) => ({
      id: e.id,
      name: e.name,
      description: e.description,
      eventType: e.eventType,
      startDate: e.startDate,
      endDate: e.endDate,
      registrationCap: e.registrationCap,
      entryFee: e.entryFee,
      location: e.location,
      _count: e._count,
      type: 'event' as const,
    })) as OrgEventItem[];
  }

  async function fetchSessions() {
    const res = await fetch(`/api/coaches/sessions?organizationId=${orgId}`);
    if (!res.ok) throw new Error(`Failed to fetch sessions: ${res.status}`);
    const data = await res.json();
    return (data || []).map((s: any) => ({
      id: s.id,
      name: s.title,
      description: s.description,
      eventType: s.sessionType || 'session',
      startDate: s.startTime,
      endDate: s.endTime,
      registrationCap: s.maxParticipants,
      entryFee: s.price || 0,
      location: s.court?.name || '',
      bookingsCount: s.bookings?.length || 0,
      type: 'session' as const,
    })) as OrgEventItem[];
  }

  async function loadItems() {
    if (!orgId) {
      setError('Organization ID is missing');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [eventItems, sessionItems] = await Promise.all([fetchEvents(), fetchSessions()]);
      const combinedItems = [...eventItems, ...sessionItems].sort(
        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
      setEvents(combinedItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading organization items');
      console.error('Error loading organization events and sessions:', err);
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

  async function handleCancelSession(sessionId: string) {
    if (!confirm('Cancel this session?')) return;
    try {
      const res = await fetch(`/api/coaches/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (!res.ok) throw new Error('Failed to cancel session');
      setEvents(events.filter(e => e.id !== sessionId));
      alert('Session cancelled successfully');
    } catch (err) {
      alert('Error cancelling session: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }

  async function handlePostponeSession(sessionId: string) {
    const newStart = window.prompt('New session start (YYYY-MM-DDTHH:MM)', '');
    if (!newStart) return;
    const newEnd = window.prompt('New session end (YYYY-MM-DDTHH:MM)', '');
    if (!newEnd) return;

    try {
      const res = await fetch(`/api/coaches/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: new Date(newStart).toISOString(),
          endTime: new Date(newEnd).toISOString(),
        }),
      });
      if (!res.ok) throw new Error('Failed to postpone session');
      const updated = await res.json();
      setEvents(events.map(e => (e.id === sessionId ? {
        ...e,
        startDate: updated.startTime,
        endDate: updated.endTime,
      } : e)));
      alert('Session postponed successfully');
    } catch (err) {
      alert('Error postponing session: ' + (err instanceof Error ? err.message : 'Unknown error'));
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

  const registeredCount = (event: OrgEventItem) =>
    event.type === 'session' ? event.bookingsCount || 0 : event._count?.registrations || 0;
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
          <div style={{ maxHeight: 520, overflowY: 'auto', paddingRight: 4 }}>
            {events.map((event: OrgEventItem, i: number) => {
              const registered = registeredCount(event);
              const status = getEventStatus(event.startDate, event.endDate);
              const isSession = event.type === 'session';
              const viewHref = isSession ? `/sessions/${event.id}` : `/organization/${orgId}/events/${event.id}`;
              const actionLabel = isSession ? 'Manage' : 'Edit';

              return (
                <div key={event.id} style={{ background: '#0f1f0f', borderRadius: 8, padding: '12px', marginBottom: i < events.length - 1 ? 8 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{event.name}</div>
                      <div style={{ fontSize: 9, color: G.muted, marginTop: 2 }}>📅 {new Date(event.startDate).toLocaleDateString()}</div>
                      <div style={{ fontSize: 9, color: G.lime, marginTop: 2 }}>
                        {isSession ? 'Session' : event.eventType === 'tournament' ? 'Tournament' : 'Event'}
                      </div>
                    </div>
                    <span style={{ fontSize: 9, padding: '4px 8px', background: G.lime + '33', color: G.lime, borderRadius: 4, fontWeight: 700 }}>
                      {status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, color: G.muted, marginBottom: 2 }}>{isSession ? 'Attendees' : 'Registrations'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 6, background: G.dark, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(registered / event.registrationCap) * 100}%`, background: G.lime, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 600, minWidth: 40, textAlign: 'right' }}>{registered}/{event.registrationCap}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 9, color: G.muted, marginBottom: 2 }}>Fee</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: G.accent }}>${typeof event.entryFee === 'number' ? event.entryFee.toFixed(2) : '0.00'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Link href={viewHref} style={{ flex: 1 }}>
                      <button style={{ width: '100%', padding: '6px', background: G.bright, color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
                        View Details
                      </button>
                    </Link>
                    {isSession ? (
                      <>
                        <button
                          onClick={() => handlePostponeSession(event.id)}
                          style={{ flex: 1, padding: '6px', background: G.mid, color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Postpone
                        </button>
                        <button
                          onClick={() => handleCancelSession(event.id)}
                          style={{ flex: 1, padding: '6px', background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <button style={{ width: '100%', marginTop: 12, padding: '8px', background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
          + Create New Event
        </button>
      </div>
    </div>
  );
}
