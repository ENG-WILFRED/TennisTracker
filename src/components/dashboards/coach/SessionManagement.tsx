'use client';
// ─────────────────────────────────────────────────────────────────
// SessionManagement.tsx  –  Vico Sports design system
// ─────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/ToastContext';

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
  date?: string
  type?: string
  completed?: boolean
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
  const { addToast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');
  
  // Advanced filters
  const [selectedSessionTypes, setSelectedSessionTypes] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [dateRange, setDateRange] = useState<[string, string]>(['', '']);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const [formData, setFormData] = useState({ title: '', description: '', startTime: '', endTime: '', sessionType: '1-on-1', maxParticipants: 1, price: 60, court: '' });
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/coaches/activities?coachId=${coachId}`);
        if (res.ok) {
          const data = await res.json();
          const activities = Array.isArray(data.activities) ? data.activities : [];
          if (activities.length > 0) {
            setSessions(
              activities
                .map((activity: any) => {
                  // Validate date and time fields exist
                  if (!activity.date || !activity.startTime || !activity.endTime) {
                    console.warn('Skipping activity with missing date/time:', activity);
                    return null;
                  }
                  
                  // Convert date + startTime to ISO datetime
                  const startDateTime = new Date(`${activity.date}T${activity.startTime}:00Z`);
                  const endDateTime = new Date(`${activity.date}T${activity.endTime}:00Z`);
                  
                  // Validate that dates were created successfully
                  if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
                    console.warn('Invalid date format for activity:', activity);
                    return null;
                  }
                  
                  // Map activity metadata based on type
                  const metadata = activity.metadata || {};
                  
                  return {
                    id: activity.id,
                    title: activity.title,
                    description: activity.description,
                    startTime: startDateTime.toISOString(),
                    endTime: endDateTime.toISOString(),
                    sessionType: activity.type === 'session' ? (metadata.sessionType || '1-on-1') : 'other',
                    status: activity.completed ? 'completed' : 'scheduled',
                    maxParticipants: activity.type === 'session' ? (metadata.maxParticipants || 1) : 1,
                    price: activity.type === 'session' ? metadata.price : undefined,
                    bookings: [],
                    court: activity.type === 'session' ? (metadata.court || metadata.courtId || '') : (activity.type === 'tournament' ? metadata.location : ''),
                    date: activity.date,
                    type: activity.type,
                    completed: activity.completed,
                  };
                })
                .filter((session: any): session is Session => session !== null)
            );
          }
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [coachId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Convert startTime and endTime from datetime-local to date and time parts
      const startDT = new Date(formData.startTime);
      const endDT = new Date(formData.endTime);
      const dateStr = startDT.toISOString().split('T')[0];
      const startTimeStr = startDT.toTimeString().slice(0, 5);
      const endTimeStr = endDT.toTimeString().slice(0, 5);

      const res = await fetch('/api/coaches/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId,
          type: 'session',
          date: dateStr,
          startTime: startTimeStr,
          endTime: endTimeStr,
          title: formData.title,
          description: formData.description,
          metadata: {
            sessionType: formData.sessionType,
            maxParticipants: formData.maxParticipants,
            price: formData.price,
            court: formData.court,
          },
        }),
      });
      if (res.ok) {
        const newActivity = await res.json();
        const startDateTime = new Date(`${newActivity.date}T${newActivity.startTime}:00Z`);
        const endDateTime = new Date(`${newActivity.date}T${newActivity.endTime}:00Z`);
        const newSession: Session = {
          id: newActivity.id,
          title: newActivity.title,
          description: newActivity.description,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          sessionType: formData.sessionType,
          status: 'scheduled',
          maxParticipants: formData.maxParticipants,
          price: formData.price,
          bookings: [],
          court: formData.court,
        };
        setSessions([...sessions, newSession]);
        setShowForm(false);
        setFormData({ title: '', description: '', startTime: '', endTime: '', sessionType: '1-on-1', maxParticipants: 1, price: 60, court: '' });
        addToast('Session created successfully!', 'success');
      } else {
        addToast('Failed to create activity', 'error');
      }
    } catch (error) {
      console.error('Error creating activity:', error);
      addToast('Error creating activity', 'error');
    }
  };

  const handleDelete = async (sessionId: string) => {
    setDeleteConfirmId(sessionId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    
    try {
      const res = await fetch(`/api/coaches/activities/${deleteConfirmId}?coachId=${coachId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSessions(sessions.filter(s => s.id !== deleteConfirmId));
        addToast('Session deleted successfully', 'success');
      } else {
        const error = await res.json();
        addToast(error.error || 'Failed to delete session', 'error');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      addToast('Error deleting session', 'error');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleEdit = (session: Session) => {
    const startDT = new Date(session.startTime);
    const endDT = new Date(session.endTime);
    
    setEditingId(session.id);
    setShowForm(true);
    setFormData({
      title: session.title,
      description: session.description || '',
      startTime: startDT.toISOString().slice(0, 16),
      endTime: endDT.toISOString().slice(0, 16),
      sessionType: session.sessionType,
      maxParticipants: session.maxParticipants,
      price: session.price || 60,
      court: (typeof session.court === 'string' ? session.court : session.court?.name) || '',
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      const startDT = new Date(formData.startTime);
      const endDT = new Date(formData.endTime);
      const dateStr = startDT.toISOString().split('T')[0];
      const startTimeStr = startDT.toTimeString().slice(0, 5);
      const endTimeStr = endDT.toTimeString().slice(0, 5);

      const res = await fetch(`/api/coaches/activities/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId,
          type: 'session',
          date: dateStr,
          startTime: startTimeStr,
          endTime: endTimeStr,
          title: formData.title,
          description: formData.description,
          metadata: {
            sessionType: formData.sessionType,
            maxParticipants: formData.maxParticipants,
            price: formData.price,
            court: formData.court,
          },
        }),
      });

      if (res.ok) {
        const updatedActivity = await res.json();
        const startDateTime = new Date(`${updatedActivity.activity.date}T${updatedActivity.activity.startTime}:00Z`);
        const endDateTime = new Date(`${updatedActivity.activity.date}T${updatedActivity.activity.endTime}:00Z`);
        
        setSessions(sessions.map(s => 
          s.id === editingId 
            ? {
                ...s,
                title: formData.title,
                description: formData.description,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                sessionType: formData.sessionType,
                maxParticipants: formData.maxParticipants,
                price: formData.price,
                court: formData.court,
              }
            : s
        ));
        setEditingId(null);
        setShowForm(false);
        setFormData({ title: '', description: '', startTime: '', endTime: '', sessionType: '1-on-1', maxParticipants: 1, price: 60, court: '' });
        addToast('Session updated successfully', 'success');
      } else {
        addToast('Failed to update session', 'error');
      }
    } catch (error) {
      console.error('Error updating session:', error);
      addToast('Error updating session', 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({ title: '', description: '', startTime: '', endTime: '', sessionType: '1-on-1', maxParticipants: 1, price: 60, court: '' });
  };

  // Get unique values from sessions for filter options
  const getUniqueSessionTypes = () => {
    const types = new Set(sessions.map(s => s.sessionType));
    return Array.from(types).sort();
  };

  const getUniqueLocations = () => {
    const locations = new Set(sessions.filter(s => s.court).map(s => typeof s.court === 'string' ? s.court : s.court?.name || ''));
    return Array.from(locations).filter(Boolean).sort();
  };

  const getPriceRange = () => {
    const prices = sessions.filter(s => s.price).map(s => s.price || 0);
    return {
      min: Math.min(...prices, 0),
      max: Math.max(...prices, 500)
    };
  };

  // Advanced filter logic
  const applyAdvancedFilters = (sessionList: Session[]) => {
    return sessionList.filter(session => {
      // Filter by session type
      if (selectedSessionTypes.length > 0 && !selectedSessionTypes.includes(session.sessionType)) {
        return false;
      }

      // Filter by location
      if (selectedLocations.length > 0) {
        const courtName = typeof session.court === 'string' ? session.court : session.court?.name || '';
        if (!selectedLocations.includes(courtName)) {
          return false;
        }
      }

      // Filter by price range
      const sessionPrice = session.price || 0;
      if (sessionPrice < priceRange[0] || sessionPrice > priceRange[1]) {
        return false;
      }

      // Filter by date range
      if (dateRange[0]) {
        const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
        if (sessionDate < dateRange[0]) {
          return false;
        }
      }

      if (dateRange[1]) {
        const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
        if (sessionDate > dateRange[1]) {
          return false;
        }
      }

      return true;
    });
  };

  // Apply status filter first, then advanced filters
  const filtered = applyAdvancedFilters(
    sessions.filter(s => {
      if (filter === 'upcoming') return new Date(s.startTime) >= new Date();
      if (filter === 'completed') return s.status === 'completed' || new Date(s.startTime) < new Date();
      return true;
    })
  );

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
          <SectionLabel>{editingId ? 'Edit Session Details' : 'New Session Details'}</SectionLabel>
          <form onSubmit={editingId ? handleUpdate : handleSubmit}>
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
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" style={{ background: G.lime, color: '#0a180a', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
                {editingId ? '✓ Update Session' : '✓ Create Session'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancelEdit} style={{ background: G.border, color: G.text, border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
                  ✕ Cancel
                </button>
              )}
            </div>
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
        <div style={{ flex: 0.5 }} />
        <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} style={{ padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 10.5, fontWeight: 700, background: showAdvancedFilters ? G.border : 'transparent', color: showAdvancedFilters ? G.lime : G.muted, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
          🔽 Filters {(selectedSessionTypes.length > 0 || selectedLocations.length > 0 || dateRange[0] || dateRange[1]) && <span style={{ fontSize: 9, background: G.lime, color: '#0a180a', borderRadius: 3, padding: '1px 4px', fontWeight: 800 }}>Active</span>}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 9, padding: 12 }}>
          <SectionLabel>Advanced Filters</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
            
            {/* Session Type Filter */}
            <div>
              <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 6, fontWeight: 700 }}>SESSION TYPE</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {getUniqueSessionTypes().map(type => (
                  <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, cursor: 'pointer', color: G.text }}>
                    <input type="checkbox" checked={selectedSessionTypes.includes(type)} onChange={e => {
                      if (e.target.checked) {
                        setSelectedSessionTypes([...selectedSessionTypes, type]);
                      } else {
                        setSelectedSessionTypes(selectedSessionTypes.filter(t => t !== type));
                      }
                    }} style={{ cursor: 'pointer', width: 14, height: 14 }} />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Location Filter */}
            <div>
              <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 6, fontWeight: 700 }}>LOCATION / COURT</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {getUniqueLocations().map(location => (
                  <label key={location} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, cursor: 'pointer', color: G.text }}>
                    <input type="checkbox" checked={selectedLocations.includes(location)} onChange={e => {
                      if (e.target.checked) {
                        setSelectedLocations([...selectedLocations, location]);
                      } else {
                        setSelectedLocations(selectedLocations.filter(l => l !== location));
                      }
                    }} style={{ cursor: 'pointer', width: 14, height: 14 }} />
                    <span>📍 {location}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 6, fontWeight: 700 }}>DATE RANGE</label>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="date" value={dateRange[0]} onChange={e => setDateRange([e.target.value, dateRange[1]])} style={{ ...inputSt, flex: 1, padding: '6px 8px', fontSize: 9.5 }} />
                <span style={{ fontSize: 9, color: G.muted }}>to</span>
                <input type="date" value={dateRange[1]} onChange={e => setDateRange([dateRange[0], e.target.value])} style={{ ...inputSt, flex: 1, padding: '6px 8px', fontSize: 9.5 }} />
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <label style={{ fontSize: 9.5, color: G.muted2, display: 'block', marginBottom: 6, fontWeight: 700 }}>PRICE RANGE</label>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="number" min={getPriceRange().min} max={getPriceRange().max} value={priceRange[0]} onChange={e => setPriceRange([parseFloat(e.target.value) || 0, priceRange[1]])} style={{ ...inputSt, flex: 1, padding: '6px 8px', fontSize: 9.5 }} placeholder="Min" />
                <span style={{ fontSize: 9, color: G.muted }}>-</span>
                <input type="number" min={getPriceRange().min} max={getPriceRange().max} value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], parseFloat(e.target.value) || 500])} style={{ ...inputSt, flex: 1, padding: '6px 8px', fontSize: 9.5 }} placeholder="Max" />
                <span style={{ fontSize: 9, color: G.muted, whiteSpace: 'nowrap' }}>$</span>
              </div>
            </div>
          </div>

          {/* Reset Filters Button */}
          {(selectedSessionTypes.length > 0 || selectedLocations.length > 0 || dateRange[0] || dateRange[1]) && (
            <button onClick={() => {
              setSelectedSessionTypes([]);
              setSelectedLocations([]);
              setPriceRange([0, 500]);
              setDateRange(['', '']);
            }} style={{ background: 'transparent', color: G.lime2, border: `1px dashed ${G.border2}`, borderRadius: 6, padding: '6px 12px', fontWeight: 700, fontSize: 9.5, cursor: 'pointer', marginTop: 10 }}>
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Session List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', color: G.muted, padding: 30 }}>No activities found</div>
        ) : (
          filtered.map(session => {
            const fillPct = Math.round((session.bookings.length / session.maxParticipants) * 100);
            const isFull = session.bookings.length >= session.maxParticipants;
            const typeColor = session.type === 'session' ? sessionTypeColors[session.sessionType] || G.lime : G.muted;
            
            // Check if activity is in the past (read-only)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const activityDate = session.date ? new Date(`${session.date}T00:00:00Z`) : new Date(session.startTime);
            const isPast = activityDate < today;
            const isHovered = hoveredSessionId === session.id;
            
            return (
              <div key={session.id} 
                onMouseEnter={() => setHoveredSessionId(session.id)} 
                onMouseLeave={() => setHoveredSessionId(null)} style={{ background: isPast ? G.card2 : G.card, border: `1px solid ${isPast ? G.border : G.border}`, borderRadius: 11, padding: 13, borderLeft: `3px solid ${isPast ? G.muted : typeColor}`, transition: 'border-color .15s', opacity: isPast ? 0.7 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: isPast ? G.muted : G.text }}>{session.title}</span>
                      {isPast && <Tag color={G.muted}>Completed</Tag>}
                      {isFull && !isPast && <Tag color={G.red}>Full</Tag>}
                    </div>
                    {session.description && <p style={{ fontSize: 10.5, color: isPast ? G.muted2 : G.muted2, marginBottom: 7, lineHeight: 1.5 }}>{session.description}</p>}
                    <div style={{ display: 'flex', gap: 12, fontSize: 10, color: isPast ? G.muted : G.muted2, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span>🕐 {format(new Date(session.startTime), 'MMM d, HH:mm')} – {format(new Date(session.endTime), 'HH:mm')}</span>
                      {session.court && <span>📍 {typeof session.court === 'string' ? session.court : session.court.name}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Tag color={isPast ? G.muted : typeColor}>{session.sessionType}</Tag>
                      <Tag color={session.status === 'scheduled' ? (isPast ? G.muted : G.lime) : G.muted}>{session.status}</Tag>
                      {session.price && <Tag yellow>${session.price}/player</Tag>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: isPast ? G.muted : G.lime2 }}>{session.bookings.length}<span style={{ fontSize: 11, color: G.muted }}>/{ session.maxParticipants}</span></div>
                    <div style={{ fontSize: 8.5, color: G.muted, marginBottom: 4 }}>players</div>
                    <div style={{ width: 60, height: 4, background: G.dark, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${fillPct}%`, background: isFull ? G.red : isPast ? G.muted : G.lime, borderRadius: 2 }} />
                    </div>
                    {!isPast && isHovered && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                        <button onClick={() => handleEdit(session)} style={{ padding: '4px 8px', fontSize: 8.5, borderRadius: 4, border: 'none', background: G.blue, color: '#0a180a', cursor: 'pointer', fontWeight: 700 }}>Edit</button>
                        <button onClick={() => handleDelete(session.id)} style={{ padding: '4px 8px', fontSize: 8.5, borderRadius: 4, border: 'none', background: G.red, color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 24, 10, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: 20, maxWidth: 400, boxShadow: '0 20px 25px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: G.text, marginBottom: 8 }}>Delete Session?</div>
            <div style={{ fontSize: 12, color: G.muted2, marginBottom: 20, lineHeight: 1.6 }}>
              Are you sure you want to delete this session? This action cannot be undone. Any player bookings will be lost.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setDeleteConfirmId(null)} 
                style={{ padding: '8px 16px', fontSize: 11, borderRadius: 6, border: `1px solid ${G.border}`, background: 'transparent', color: G.text, cursor: 'pointer', fontWeight: 700 }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                style={{ padding: '8px 16px', fontSize: 11, borderRadius: 6, border: 'none', background: G.red, color: '#fff', cursor: 'pointer', fontWeight: 700 }}
              >
                Delete Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}