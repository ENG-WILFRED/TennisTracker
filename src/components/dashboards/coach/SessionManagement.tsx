'use client';
// ─────────────────────────────────────────────────────────────────
// SessionManagement.tsx  –  Vico Sports design system
// ─────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';

const G = {
  dark: '#0a180a', sidebar: '#0f1e0f', card: '#162616', card2: '#1b2f1b', card3: '#203520',
  border: '#243e24', border2: '#326832', mid: '#2a5224', bright: '#3a7230',
  lime: '#79bf3e', lime2: '#a8d84e', text: '#e4f2da', text2: '#c2dbb0',
  muted: '#5e8e50', muted2: '#7aaa68', yellow: '#efc040', red: '#d94f4f', blue: '#4a9eff',
};

interface Session {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  sessionType: string
  status: string
  maxParticipants: number
  price?: number
  bookings: any[]
  court?: { id: string; name: string } | string
}

const SL: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  <div style={{ fontSize: 8.5, color: G.lime2, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 7 }}>{children || null}</div>;
// Inline helper (avoids TS prop issue)
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 8.5, color: G.lime2, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 7 }}>{children}</div>
);
const Tag = ({ children, yellow, red, color }: { children: React.ReactNode; yellow?: boolean; red?: boolean; color?: string }) => {
  const c = color || (yellow ? G.yellow : red ? G.red : G.lime);
  return <span style={{ fontSize: 8.5, fontWeight: 700, borderRadius: 4, padding: '2px 7px', background: `${c}22`, border: `1px solid ${c}44`, color: c, display: 'inline-block' }}>{children}</span>;
};

export default function SessionManagement({ coachId }: { coachId: string }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');
  const [formData, setFormData] = useState({ title: '', description: '', startTime: '', endTime: '', sessionType: '1-on-1', maxParticipants: 1, price: 60, court: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/coaches/sessions?coachId=${coachId}`);
        if (res.ok) {
          const d = await res.json();
          if (d && Array.isArray(d) && d.length > 0) {
            setSessions(
              d.map((session: any) => ({
                id: session.id,
                title: session.title,
                description: session.description,
                startTime: session.startTime,
                endTime: session.endTime,
                sessionType: session.sessionType || '1-on-1',
                status: session.status || 'scheduled',
                maxParticipants: session.maxParticipants || 1,
                price: session.price,
                bookings: session.bookings || [],
                court: session.court?.name || session.court || '',
              }))
            );
          }
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [coachId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/coaches/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coachId, ...formData, startTime: new Date(formData.startTime).toISOString(), endTime: new Date(formData.endTime).toISOString() }),
      });
      if (res.ok) {
        const newSession = await res.json();
        setSessions([...sessions, newSession]);
        setShowForm(false);
        setFormData({ title: '', description: '', startTime: '', endTime: '', sessionType: '1-on-1', maxParticipants: 1, price: 60, court: '' });
      } else {
        alert('Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Error creating session');
    }
  };

  const filtered = sessions.filter(s => {
    if (filter === 'upcoming') return new Date(s.startTime) >= new Date();
    if (filter === 'completed') return s.status === 'completed' || new Date(s.startTime) < new Date();
    return true;
  });

  const card = { background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: 14 } as const;
  const inputSt = { width: '100%', padding: '8px 11px', background: G.dark, border: `1px solid ${G.border}`, color: G.text, borderRadius: 7, fontSize: 11.5, outline: 'none', boxSizing: 'border-box' } as const;

  if (loading) return <div style={{ ...card, color: G.muted, textAlign: 'center', padding: 40 }}>Loading sessions...</div>;

  const sessionTypeColors: Record<string, string> = { '1-on-1': G.lime, group: G.blue, clinic: G.yellow };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color: G.text }}>📅 My Sessions</div>
          <div style={{ fontSize: 10, color: G.muted2, marginTop: 2 }}>Create and manage coaching sessions</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Tag>{sessions.length} total</Tag>
          <button onClick={() => setShowForm(!showForm)} style={{ background: showForm ? G.border : G.lime, color: showForm ? G.text : '#0a180a', border: 'none', borderRadius: 7, padding: '7px 13px', fontWeight: 800, fontSize: 10.5, cursor: 'pointer' }}>
            {showForm ? '✕ Cancel' : '+ Create Session'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 9 }}>
        {[
          { label: 'Upcoming', value: sessions.filter(s => new Date(s.startTime) >= new Date()).length, color: G.lime2 },
          { label: '1-on-1', value: sessions.filter(s => s.sessionType === '1-on-1').length, color: G.lime },
          { label: 'Group', value: sessions.filter(s => s.sessionType !== '1-on-1').length, color: G.blue },
          { label: 'Revenue Est.', value: `$${sessions.reduce((a, s) => a + (s.price || 0) * s.bookings.length, 0)}`, color: G.yellow },
        ].map((st, i) => (
          <div key={i} style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 8, color: G.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{st.label}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: st.color, marginTop: 4, lineHeight: 1 }}>{st.value}</div>
          </div>
        ))}
      </div>

      {/* Create Form */}
      {showForm && (
        <div style={card}>
          <SectionLabel>New Session Details</SectionLabel>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 4 }}>SESSION TITLE *</label>
                <input style={inputSt} placeholder="e.g. Alex – Serve Clinic" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 4 }}>SESSION TYPE</label>
                <select style={inputSt} value={formData.sessionType} onChange={e => setFormData({ ...formData, sessionType: e.target.value })}>
                  <option value="1-on-1">1-on-1</option>
                  <option value="group">Group</option>
                  <option value="clinic">Clinic</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 4 }}>START TIME *</label>
                <input style={inputSt} type="datetime-local" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 4 }}>END TIME *</label>
                <input style={inputSt} type="datetime-local" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 4 }}>COURT / LOCATION</label>
                <input style={inputSt} placeholder="e.g. Court 1" value={formData.court} onChange={e => setFormData({ ...formData, court: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 4 }}>MAX PLAYERS</label>
                  <input style={inputSt} type="number" min={1} value={formData.maxParticipants} onChange={e => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })} />
                </div>
                <div>
                  <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 4 }}>PRICE ($)</label>
                  <input style={inputSt} type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} />
                </div>
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 4 }}>DESCRIPTION</label>
              <textarea style={{ ...inputSt, resize: 'none' }} rows={2} placeholder="Session objectives and drills..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <button type="submit" style={{ marginTop: 12, background: G.lime, color: '#0a180a', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
              ✓ Create Session
            </button>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 3, background: G.card, border: `1px solid ${G.border}`, borderRadius: 9, padding: 3 }}>
        {(['all', 'upcoming', 'completed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ flex: 1, padding: '6px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 10.5, fontWeight: 700, background: filter === f ? G.lime : 'transparent', color: filter === f ? '#0a180a' : G.muted, textTransform: 'capitalize' }}>
            {f}
          </button>
        ))}
      </div>

      {/* Session List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', color: G.muted, padding: 30 }}>No sessions found</div>
        ) : (
          filtered.map(session => {
            const fillPct = Math.round((session.bookings.length / session.maxParticipants) * 100);
            const isFull = session.bookings.length >= session.maxParticipants;
            const typeColor = sessionTypeColors[session.sessionType] || G.lime;
            return (
              <div key={session.id} style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 11, padding: 13, borderLeft: `3px solid ${typeColor}`, transition: 'border-color .15s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 800 }}>{session.title}</span>
                      {isFull && <Tag color={G.red}>Full</Tag>}
                    </div>
                    {session.description && <p style={{ fontSize: 10.5, color: G.muted2, marginBottom: 7, lineHeight: 1.5 }}>{session.description}</p>}
                    <div style={{ display: 'flex', gap: 12, fontSize: 10, color: G.muted2, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span>🕐 {format(new Date(session.startTime), 'MMM d, HH:mm')} – {format(new Date(session.endTime), 'HH:mm')}</span>
                      {session.court && <span>📍 {typeof session.court === 'string' ? session.court : session.court.name}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Tag color={typeColor}>{session.sessionType}</Tag>
                      <Tag color={session.status === 'scheduled' ? G.lime : G.muted}>{session.status}</Tag>
                      {session.price && <Tag yellow>${session.price}/player</Tag>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: G.lime2 }}>{session.bookings.length}<span style={{ fontSize: 11, color: G.muted }}>/{session.maxParticipants}</span></div>
                    <div style={{ fontSize: 8.5, color: G.muted, marginBottom: 4 }}>players</div>
                    <div style={{ width: 60, height: 4, background: G.dark, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${fillPct}%`, background: isFull ? G.red : G.lime, borderRadius: 2 }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}