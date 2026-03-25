'use client';

import React from 'react';

const G = {
  dark: '#0f1f0f', sidebar: '#152515', card: '#1a3020', cardBorder: '#2d5a35',
  mid: '#2d5a27', bright: '#3d7a32', lime: '#7dc142', accent: '#a8d84e',
  text: '#e8f5e0', muted: '#7aaa6a', yellow: '#f0c040',
};

interface ScheduleSectionProps {
  scheduleItems: any[];
}

export default function OrganizationScheduleSection({ scheduleItems }: ScheduleSectionProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Schedule Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>Upcoming Events</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.lime, marginBottom: 6 }}>{scheduleItems.length}</div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>Active This Week</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.bright, marginBottom: 6 }}>{scheduleItems.filter(s => s.status === 'Active').length}</div>
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>Scheduled</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.accent, marginBottom: 6 }}>{scheduleItems.filter(s => s.status === 'Scheduled').length}</div>
        </div>
      </div>

      {/* Schedule List */}
      <div style={{ background: G.card, border: `1px solid ${G.cardBorder}`, borderRadius: 10, padding: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📅 This Week's Schedule</div>
        {scheduleItems.map((s: any, i: number) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < scheduleItems.length - 1 ? `1px solid ${G.cardBorder}33` : 'none', alignItems: 'flex-start' }}>
            <div style={{ background: G.dark, borderRadius: 8, padding: '8px 12px', minWidth: 70, textAlign: 'center', fontSize: 12, fontWeight: 700 }}>
              <div style={{ fontSize: 10, color: G.muted }}>Day</div>
              {s.day}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{s.event}</div>
              <div style={{ fontSize: 10, color: G.muted, marginTop: 4 }}>⏰ {s.time}</div>
            </div>
            <span style={{ fontSize: 9, padding: '4px 8px', background: s.status === 'Active' ? G.lime + '33' : G.bright + '33', color: s.status === 'Active' ? G.lime : G.bright, borderRadius: 4, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {s.status === 'Active' ? '◆' : '○'} {s.status}
            </span>
          </div>
        ))}
        <button style={{ width: '100%', marginTop: 12, padding: '8px', background: G.lime, color: '#0f1f0f', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
          + Add Event to Schedule
        </button>
      </div>
    </div>
  );
}
