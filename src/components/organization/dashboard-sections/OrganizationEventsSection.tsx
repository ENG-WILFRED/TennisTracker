'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

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
  const { user } = useAuth();
  const [events, setEvents] = useState<OrgEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<OrgEventItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    eventType: 'event',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    registrationCap: 32,
    entryFee: 0,
    prizePool: 0,
  });

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

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    const toastId = toast.loading('Creating event...');

    try {
      const response = await fetch(`/api/organization/${orgId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          description: createForm.description,
          eventType: createForm.eventType,
          startDate: new Date(createForm.startDate).toISOString(),
          endDate: createForm.endDate ? new Date(createForm.endDate).toISOString() : null,
          registrationDeadline: createForm.registrationDeadline ? new Date(createForm.registrationDeadline).toISOString() : null,
          registrationCap: createForm.registrationCap,
          entryFee: createForm.entryFee,
          prizePool: createForm.prizePool,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Failed to create event');
      }

      const created = await response.json();
      const newEvent: OrgEventItem = {
        id: created.id,
        name: created.name,
        description: created.description,
        eventType: created.eventType,
        startDate: new Date(created.startDate).toISOString(),
        endDate: created.endDate ? new Date(created.endDate).toISOString() : undefined,
        registrationCap: created.registrationCap || 0,
        entryFee: created.entryFee || 0,
        location: '',
        _count: { registrations: 0 },
        type: 'event',
      };
      setEvents((prev) => [newEvent, ...prev]);
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        description: '',
        eventType: 'event',
        startDate: '',
        endDate: '',
        registrationDeadline: '',
        registrationCap: 32,
        entryFee: 0,
        prizePool: 0,
      });
      toast.success('Event created successfully!', { id: toastId });
    } catch (err) {
      toast.error(`Failed to create event: ${err instanceof Error ? err.message : 'Unknown error'}`, { id: toastId });
    } finally {
      setCreateLoading(false);
    }
  }

  if (error) {
    return <div style={{ color: 'red', padding: 12 }}>Error: {error}</div>;
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', filter: showCreateModal ? 'blur(4px)' : 'none', transition: 'filter 180ms ease' }}>
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
      <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 13 }}>🎾 Events Management</div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{ padding: '6px 10px', background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            + Create New Event
          </button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: G.muted }}>Loading events...</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: G.muted }}>No events found</div>
        ) : (
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4 }}>
            {events.map((event: OrgEventItem, i: number) => {
              const registered = registeredCount(event);
              const status = getEventStatus(event.startDate, event.endDate);
              const isSession = event.type === 'session';
              const viewHref = isSession
                ? user?.id
                  ? `/dashboard/organization/${user.id}/session/${event.id}`
                  : `/sessions/${event.id}`
                : `/organization/${orgId}/events/${event.id}`;
              const actionLabel = isSession ? 'Manage' : 'Edit';

              return (
                <div key={event.id} style={{ background: '#0f1f0f', borderRadius: 8, padding: '12px', marginBottom: i < events.length - 1 ? 8 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.3, color: G.text, whiteSpace: 'normal', wordBreak: 'break-word' }} title={event.name}>{event.name}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: G.muted }}>📅 {new Date(event.startDate).toLocaleDateString()}</span>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: G.cardBorder, color: G.lime, fontWeight: 700, textTransform: 'uppercase' }}>
                          {isSession ? 'Session' : event.eventType === 'tournament' ? 'Tournament' : 'Event'}
                        </span>
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
      </div>
    </div>

      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => !createLoading && setShowCreateModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 580,
              background: G.card,
              border: `1px solid ${G.cardBorder}`,
              borderRadius: 18,
              padding: 24,
              boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
              position: 'relative',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: G.text }}>Create New Event</div>
                <div style={{ fontSize: 12, color: G.muted, marginTop: 4 }}>Add event details and save to publish.</div>
              </div>
              <button
                onClick={() => !createLoading && setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', color: G.muted, cursor: 'pointer', fontSize: 18, fontWeight: 700 }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateEvent} style={{ display: 'grid', gap: 14 }}>
              <input
                required
                placeholder="Event name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${G.cardBorder}`, background: G.dark, color: G.text }}
              />
              <textarea
                placeholder="Description"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                style={{ width: '100%', minHeight: 100, padding: '12px 14px', borderRadius: 10, border: `1px solid ${G.cardBorder}`, background: G.dark, color: G.text }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <select
                  value={createForm.eventType}
                  onChange={(e) => setCreateForm({ ...createForm, eventType: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${G.cardBorder}`, background: G.dark, color: G.text }}
                >
                  <option value="event">Event</option>
                  <option value="tournament">Tournament</option>
                </select>
                <input
                  required
                  type="datetime-local"
                  value={createForm.startDate}
                  onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${G.cardBorder}`, background: G.dark, color: G.text }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <input
                  type="datetime-local"
                  value={createForm.endDate}
                  onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${G.cardBorder}`, background: G.dark, color: G.text }}
                />
                <input
                  type="datetime-local"
                  value={createForm.registrationDeadline}
                  onChange={(e) => setCreateForm({ ...createForm, registrationDeadline: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${G.cardBorder}`, background: G.dark, color: G.text }}
                  placeholder="Registration deadline"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <input
                  type="number"
                  min={1}
                  value={createForm.registrationCap}
                  onChange={(e) => setCreateForm({ ...createForm, registrationCap: Number(e.target.value) })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${G.cardBorder}`, background: G.dark, color: G.text }}
                  placeholder="Registration cap"
                />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={createForm.entryFee}
                  onChange={(e) => setCreateForm({ ...createForm, entryFee: Number(e.target.value) })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${G.cardBorder}`, background: G.dark, color: G.text }}
                  placeholder="Entry fee"
                />
              </div>
              <input
                type="number"
                min={0}
                step="0.01"
                value={createForm.prizePool}
                onChange={(e) => setCreateForm({ ...createForm, prizePool: Number(e.target.value) })}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${G.cardBorder}`, background: G.dark, color: G.text }}
                placeholder="Prize pool"
              />
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => !createLoading && setShowCreateModal(false)}
                  style={{ padding: '10px 16px', background: 'transparent', border: `1px solid ${G.cardBorder}`, borderRadius: 10, color: G.text, cursor: createLoading ? 'not-allowed' : 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  style={{ padding: '10px 16px', background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 10, cursor: createLoading ? 'not-allowed' : 'pointer', fontWeight: 700 }}
                >
                  {createLoading ? 'Saving…' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
