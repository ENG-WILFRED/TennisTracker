'use client';

import React, { useEffect, useState } from 'react';
import ActivityModal, { type ActivityFormData } from './ActivityModal';

const G = {
  dark: '#0a180a',
  sidebar: '#0f1e0f',
  card: '#162616',
  card2: '#1b2f1b',
  card3: '#203520',
  border: '#243e24',
  border2: '#326832',
  mid: '#2a5224',
  bright: '#3a7230',
  lime: '#79bf3e',
  lime2: '#a8d84e',
  text: '#e4f2da',
  text2: '#c2dbb0',
  muted: '#5e8e50',
  muted2: '#7aaa68',
  yellow: '#efc040',
  red: '#d94f4f',
  blue: '#4a9eff',
};

interface Session {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  sessionType: string;
  bookings: { playerName?: string }[];
  maxParticipants: number;
  price?: number;
  court?: string;
  playerName?: string;
  description?: string;
  type?: string;
  date?: string;
  completed?: boolean;
}

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 8.5, color: G.lime2, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 7 }}>
    {children}
  </div>
);

const Tag: React.FC<{ children: React.ReactNode; yellow?: boolean; red?: boolean; color?: string }> = ({ children, yellow, red, color }) => {
  const c = color || (yellow ? G.yellow : red ? G.red : G.lime);
  const bg = color ? `${color}22` : yellow ? 'rgba(239,192,64,.1)' : red ? 'rgba(217,79,79,.1)' : 'rgba(121,191,62,.12)';
  const border = color ? `${color}44` : yellow ? 'rgba(239,192,64,.3)' : red ? 'rgba(217,79,79,.3)' : 'rgba(121,191,62,.28)';
  return <span style={{ fontSize: 8.5, fontWeight: 700, borderRadius: 4, padding: '2px 7px', background: bg, border: `1px solid ${border}`, color: c, display: 'inline-block' }}>{children}</span>;
};

const sessionColors: Record<string, string> = {
  '1-on-1': G.lime,
  'group': G.blue,
  'clinic': G.yellow,
  'scheduled': G.lime,
  'completed': G.muted,
  'cancelled': G.red,
};

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarView({ coachId }: { coachId: string }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<(ActivityFormData & { id?: string }) | null>(null);
  const [hoveredActivityId, setHoveredActivityId] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // Fetch activities from the new Activity table
        const res = await fetch(`/api/coaches/activities?coachId=${coachId}`);
        if (res.ok) {
          const data = await res.json();
          const activities = Array.isArray(data.activities) ? data.activities : [];
          
          // Transform activities to session format for calendar display
          const transformedSessions = activities.map((activity: any) => {
            // Parse date and time properly
            const dateTime = new Date(`${activity.date}T${activity.startTime}:00Z`);
            return {
              id: activity.id,
              title: activity.title,
              startTime: dateTime.toISOString(),
              endTime: new Date(`${activity.date}T${activity.endTime}:00Z`).toISOString(),
              status: 'scheduled',
              sessionType: activity.metadata?.sessionType || activity.type,
              bookings: [],
              maxParticipants: activity.metadata?.maxParticipants || 1,
              price: activity.metadata?.price || 0,
              court: activity.metadata?.court || activity.metadata?.location || '',
              playerName: activity.metadata?.playerName || '',
              description: activity.description,
              type: activity.type,
              date: activity.date,
              completed: activity.completed,
            };
          });
          
          console.log(`✓ Fetched ${transformedSessions.length} activities`);
          setSessions(transformedSessions);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [coachId, currentDate]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay });
  const today = new Date();

  const getSessionsForDay = (day: number) =>
    sessions.filter(s => {
      const d = new Date(s.startTime);
      return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });

  const selectedDaySessions = selectedDay ? getSessionsForDay(selectedDay) : [];

  // Get upcoming sessions (from today/now onwards, not completed)
  const upcomingSessions = sessions
    .filter(s => {
      if (s.completed) return false; // Don't show completed activities
      const startDate = new Date(s.startTime);
      const now = new Date();
      return startDate >= new Date(now.getFullYear(), now.getMonth(), now.getDate()); // From today onwards
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 6);

  const totalThisMonth = sessions.filter(s => {
    const d = new Date(s.startTime);
    return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
  }).length;

  const card = { background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: 14 } as const;

  const handleActivitySave = async (formData: ActivityFormData) => {
    try {
      const response = await fetch('/api/coaches/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          coachId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save activity');
      }

      // Refresh sessions if it was a session activity
      if (formData.type === 'session') {
        const res = await fetch(`/api/coaches/sessions?coachId=${coachId}`);
        if (res.ok) {
          const data = await res.json();
          setSessions(Array.isArray(data) ? data : []);
        }
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      throw error;
    }
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day === selectedDay ? null : day);
    // Just select the day, don't open modal
  };

  const handleAddActivityClick = () => {
    if (selectedDay) {
      const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay);
      setSelectedDateForModal(selectedDate.toISOString().split('T')[0]);
    } else {
      setSelectedDateForModal(new Date().toISOString().split('T')[0]);
    }
    setIsModalOpen(true);
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (confirm('Are you sure you want to delete this activity?')) {
      try {
        const response = await fetch(`/api/coaches/activities/${activityId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          // Refresh sessions
          const res = await fetch(`/api/coaches/sessions?coachId=${coachId}`);
          if (res.ok) {
            const data = await res.json();
            setSessions(Array.isArray(data) ? data : []);
          }
        }
      } catch (error) {
        console.error('Error deleting activity:', error);
      }
    }
  };

  if (loading) return <div style={{ ...card, textAlign: 'center', padding: 40, color: G.muted, fontSize: 12 }}>Loading calendar...</div>;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11, height: '100%', minHeight: 0, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color: G.text }}>📆 Session Calendar</div>
          <div style={{ fontSize: 10, color: G.muted2, marginTop: 2 }}>Manage your coaching schedule</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Tag>{totalThisMonth} sessions this month</Tag>
          <button
            onClick={() => {
              setSelectedDateForModal(new Date().toISOString().split('T')[0]);
              setIsModalOpen(true);
            }}
            style={{ background: G.lime, color: '#0a180a', border: 'none', borderRadius: 7, padding: '7px 12px', fontWeight: 800, fontSize: 10.5, cursor: 'pointer' }}>
            + New Activity
          </button>
        </div>
      </div>

      {/* Monthly Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 9, flexShrink: 0 }}>
        {[
          { icon: '📅', label: 'Scheduled', value: sessions.filter(s => s.status === 'scheduled').length, color: G.lime2 },
          { icon: '👤', label: '1-on-1', value: sessions.filter(s => s.sessionType === '1-on-1').length, color: G.lime },
          { icon: '👥', label: 'Group / Clinic', value: sessions.filter(s => s.sessionType !== '1-on-1').length, color: G.blue },
          { icon: '💰', label: 'Revenue Est.', value: `$${sessions.reduce((a, s) => a + (s.price || 0), 0)}`, color: G.yellow },
        ].map((stat, i) => (
          <div key={i} style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 10, padding: '11px 12px' }}>
            <div style={{ fontSize: 15, marginBottom: 4 }}>{stat.icon}</div>
            <div style={{ fontSize: 8, color: G.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{stat.label}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: stat.color, lineHeight: 1.1, marginTop: 2 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 11, height: '100%', minHeight: 0, flex: 1 }}>

        {/* Calendar Grid */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
          {/* Nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              style={{ background: G.card2, border: `1px solid ${G.border}`, color: G.text, borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12 }}>←</button>
            <div style={{ fontSize: 13, fontWeight: 800, color: G.text }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              style={{ background: G.card2, border: `1px solid ${G.border}`, color: G.text, borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12 }}>→</button>
          </div>

          {/* Day Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 4 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: G.muted, padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, flex: 1, minHeight: 0, gridAutoRows: '1fr' }}>
            {emptyDays.map((_, i) => <div key={`e${i}`} />)}
            {days.map(day => {
              const daySessions = getSessionsForDay(day);
              const isToday = day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
              const isSelected = day === selectedDay;
              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  style={{
                    minHeight: 120, borderRadius: 7, padding: '5px 4px', cursor: 'pointer',
                    background: isSelected ? G.card3 : isToday ? 'rgba(121,191,62,0.08)' : G.card2,
                    border: `1px solid ${isSelected ? G.lime : isToday ? 'rgba(121,191,62,0.4)' : G.border}`,
                    transition: 'all .15s',
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: isToday ? 900 : 600, color: isToday ? G.lime : G.text2, marginBottom: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {day}
                    {daySessions.length > 0 && <div style={{ width: 4, height: 4, background: G.lime, borderRadius: '50%' }} />}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {daySessions.slice(0, 2).map(s => (
                      <div key={s.id} style={{
                        fontSize: 7.5, padding: '1px 4px', borderRadius: 3,
                        background: `${sessionColors[s.sessionType] || G.lime}22`,
                        color: sessionColors[s.sessionType] || G.lime,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        border: `1px solid ${sessionColors[s.sessionType] || G.lime}44`,
                      }} title={s.title}>
                        {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    ))}
                    {daySessions.length > 2 && <div style={{ fontSize: 7, color: G.muted }}>+{daySessions.length - 2}</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 10, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${G.border}` }}>
            {[['1-on-1', G.lime], ['Group', G.blue], ['Clinic', G.yellow]].map(([label, color]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: color as string }} />
                <span style={{ fontSize: 9, color: G.muted }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, minHeight: 0, overflow: 'hidden' }}>

          {/* Selected Day Sessions */}
          <div style={{ ...card, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexShrink: 0 }}>
              <SectionLabel>
                {selectedDay ? `${monthNames[currentDate.getMonth()]} ${selectedDay}` : 'Select a day'}
              </SectionLabel>
              {selectedDay && (
                <button
                  onClick={handleAddActivityClick}
                  style={{
                    background: G.lime,
                    color: '#0a180a',
                    border: 'none',
                    borderRadius: 6,
                    padding: '5px 10px',
                    fontSize: 9.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  + Add Activity
                </button>
              )}
            </div>
            {selectedDaySessions.length === 0 ? (
              <div style={{ fontSize: 10.5, color: G.muted, padding: '12px 0', textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {selectedDay ? 'No sessions this day' : 'Click a day to see sessions'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1, minHeight: 0, overflowY: 'auto' }}>
                {selectedDaySessions.map(s => {
                  // Check if activity is in the past (read-only)
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const activityStart = new Date(s.startTime);
                  const activityDate = new Date(activityStart.getFullYear(), activityStart.getMonth(), activityStart.getDate());
                  const isPast = s.completed || activityDate < today;
                  const isHovered = hoveredActivityId === s.id;

                  return (
                  <div key={s.id} 
                    onMouseEnter={() => setHoveredActivityId(s.id)} 
                    onMouseLeave={() => setHoveredActivityId(null)}
                    style={{ background: isPast ? G.card : G.card2, border: `1px solid ${G.border}`, borderRadius: 8, padding: 10, borderLeft: `3px solid ${isPast ? G.muted : sessionColors[s.sessionType] || G.lime}`, opacity: isPast ? 0.7 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, flex: 1, color: isPast ? G.muted : G.text }}>{s.title}{isPast && <span style={{ fontSize: 9, color: G.muted, fontWeight: 400, marginLeft: 6 }}>(Completed)</span>}</div>
                      {!isPast && isHovered && (
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button
                          onClick={() => {
                            setEditingActivity(s as unknown as ActivityFormData & { id?: string });
                            const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay!);
                            setSelectedDateForModal(selectedDate.toISOString().split('T')[0]);
                            setIsModalOpen(true);
                          }}
                          style={{
                            background: G.bright,
                            border: 'none',
                            borderRadius: 4,
                            padding: '3px 6px',
                            fontSize: 8,
                            fontWeight: 700,
                            cursor: 'pointer',
                            color: G.text,
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteActivity(s.id)}
                          style={{
                            background: G.red,
                            border: 'none',
                            borderRadius: 4,
                            padding: '3px 6px',
                            fontSize: 8,
                            fontWeight: 700,
                            cursor: 'pointer',
                            color: '#fff',
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 5 }}>
                      <span style={{ fontSize: 9.5, color: G.muted2 }}>🕐 {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {s.court && <span style={{ fontSize: 9.5, color: G.muted2 }}>📍 {s.court}</span>}
                      <span style={{ fontSize: 9.5, color: G.muted2 }}>👥 {s.bookings.length}/{s.maxParticipants}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Tag color={isPast ? G.muted : sessionColors[s.sessionType]}>{s.sessionType}</Tag>
                      {s.price && <Tag yellow>${s.price}</Tag>}
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>

          {/* Upcoming Sessions */}
          <div style={{ ...card, flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <SectionLabel>Upcoming Sessions</SectionLabel>
              <Tag>{upcomingSessions.length}</Tag>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {upcomingSessions.length === 0 ? (
                <div style={{ fontSize: 10.5, color: G.muted }}>No upcoming sessions</div>
              ) : (
                upcomingSessions.map(s => {
                  const start = new Date(s.startTime);
                  const diffDays = Math.ceil((start.getTime() - Date.now()) / 86400000);
                  return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: `1px solid ${G.border}` }}>
                      <div style={{ background: G.card3, border: `1px solid ${G.border2}`, borderRadius: 7, padding: '5px 7px', textAlign: 'center', minWidth: 36, flexShrink: 0 }}>
                        <div style={{ fontSize: 7, color: G.muted, textTransform: 'uppercase' }}>{monthNames[start.getMonth()].slice(0, 3)}</div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: G.lime, lineHeight: 1 }}>{start.getDate()}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                        <div style={{ fontSize: 9, color: G.muted, marginTop: 2 }}>
                          {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {s.bookings.length}/{s.maxParticipants}
                        </div>
                      </div>
                      <div style={{ fontSize: 9, color: diffDays === 0 ? G.lime : G.muted, fontWeight: diffDays === 0 ? 800 : 400 }}>
                        {diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tmr' : `${diffDays}d`}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Activity Modal */}
    <ActivityModal
      isOpen={isModalOpen}
      selectedDate={selectedDateForModal}
      onClose={() => {
        setIsModalOpen(false);
        setEditingActivity(null);
      }}
      onSave={handleActivitySave}
      coachId={coachId}
      editingActivity={editingActivity}
    />
    </>
  );
}