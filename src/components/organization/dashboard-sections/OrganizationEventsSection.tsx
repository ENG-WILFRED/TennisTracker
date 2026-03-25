'use client';

import React, { useState } from 'react';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

interface EventsSectionProps {
  // Events data will be fetched when section is active
}

export default function OrganizationEventsSection({}: EventsSectionProps) {
  const [events] = useState<any[]>([
    { id: 1, name: 'Spring Tournament', date: '2024-04-15', registrationCap: 32, registered: 28, status: 'Open', entryFee: 50 },
    { id: 2, name: 'Weekly Doubles', date: '2024-03-30', registrationCap: 16, registered: 14, status: 'Open', entryFee: 25 },
    { id: 3, name: 'Coaching Clinic', date: '2024-04-05', registrationCap: 20, registered: 18, status: 'Open', entryFee: 35 },
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Events Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>Total Events</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.lime, marginBottom: 6 }}>{events.length}</div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>Registrations</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.bright, marginBottom: 6 }}>{events.reduce((sum, e) => sum + e.registered, 0)}</div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>Total Revenue</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.accent, marginBottom: 6 }}>${events.reduce((sum, e) => sum + (e.registered * e.entryFee), 0)}</div>
        </div>
      </div>

      {/* Events List */}
      <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>🎾 Upcoming Events</div>
        {events.map((event: any, i: number) => (
          <div key={event.id} style={{ background: '#0f1f0f', borderRadius: 8, padding: '12px', marginBottom: i < events.length - 1 ? 8 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{event.name}</div>
                <div style={{ fontSize: 9, color: G.muted, marginTop: 2 }}>📅 {new Date(event.date).toLocaleDateString()}</div>
              </div>
              <span style={{ fontSize: 9, padding: '4px 8px', background: G.lime + '33', color: G.lime, borderRadius: 4, fontWeight: 700 }}>
                {event.status}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: G.muted, marginBottom: 2 }}>Registrations</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, height: 6, background: G.dark, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(event.registered / event.registrationCap) * 100}%`, background: G.lime, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 600, minWidth: 40, textAlign: 'right' }}>{event.registered}/{event.registrationCap}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, color: G.muted, marginBottom: 2 }}>Entry Fee</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: G.accent }}>${event.entryFee}</div>
              </div>
            </div>
            <button style={{ width: '100%', padding: '6px', background: G.bright, color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
              Manage Event
            </button>
          </div>
        ))}
        <button style={{ width: '100%', marginTop: 12, padding: '8px', background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
          + Create New Event
        </button>
      </div>
    </div>
  );
}
