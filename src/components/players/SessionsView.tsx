'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { LoadingState } from '@/components/LoadingState';

interface Session {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  sessionType: string;
  status: string;
  coach: { id: string; name: string; photo?: string };
  court?: { id: string; name: string; courtNumber?: number; surface?: string };
  organization?: { id: string; name: string };
  price?: number;
  maxParticipants?: number;
  isDirectAssignment: boolean;
  booking?: any;
  type: 'session';
}

interface Task {
  id: string;
  templateId: string;
  organizationId: string;
  assignedToId: string;
  assignedToUser: { id: string; firstName: string; lastName: string; email: string; photo?: string };
  status: string;
  context: Record<string, any>;
  dueDate?: string;
  startedAt?: string;
  completedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  template: { id: string; name: string; type: string; role: string; description?: string };
  organization: { id: string; name: string };
  type: 'task';
}

interface SessionsViewProps {
  isEmbedded?: boolean;
  playerId?: string;
}

// ─── Design tokens ───────────────────────────────────────────────────────────
const G = {
  bg:         '#07120a',
  surface:    '#0d1f10',
  card:       '#111f14',
  cardHover:  '#162a1a',
  border:     '#1e3d24',
  borderBright:'#2e5c36',
  mid:        '#2a5430',
  bright:     '#3a7040',
  lime:       '#72c142',
  accent:     '#9edd4a',
  glow:       'rgba(114,193,66,0.18)',
  text:       '#e6f4e0',
  textSub:    '#a8c8a0',
  muted:      '#5a8060',
  yellow:     '#f0c040',
  red:        '#ff6b6b',
  blue:       '#6bb5ff',
};

const STATUS_META: Record<string, { label: string; bg: string; text: string; border: string; dot: string; icon: string }> = {
  scheduled:    { label: 'Scheduled',   bg: '#0e2a1a', text: '#72c142', border: '#2e5c36', dot: '#72c142', icon: '🟢' },
  confirmed:    { label: 'Confirmed',   bg: '#0e1e38', text: '#6bb5ff', border: '#1e4878', dot: '#6bb5ff', icon: '🔵' },
  'in-progress':{ label: 'In Progress', bg: '#2a1e08', text: '#f0c040', border: '#5a4010', dot: '#f0c040', icon: '🟡' },
  completed:    { label: 'Completed',   bg: '#0e2a1a', text: '#72c142', border: '#2e5c36', dot: '#72c142', icon: '✅' },
  cancelled:    { label: 'Cancelled',   bg: '#2a0e0e', text: '#ff6b6b', border: '#5a1e1e', dot: '#ff6b6b', icon: '🔴' },
  'no-show':    { label: 'No Show',     bg: '#2a1a0e', text: '#ffaa66', border: '#5a3010', dot: '#ffaa66', icon: '🟠' },
  ASSIGNED:     { label: 'Assigned',    bg: '#0e1e38', text: '#6bb5ff', border: '#1e4878', dot: '#6bb5ff', icon: '📌' },
  ACCEPTED:     { label: 'Accepted',    bg: '#0e2a1a', text: '#72c142', border: '#2e5c36', dot: '#72c142', icon: '✅' },
  IN_PROGRESS:  { label: 'In Progress', bg: '#2a1e08', text: '#f0c040', border: '#5a4010', dot: '#f0c040', icon: '⚡' },
  COMPLETED:    { label: 'Completed',   bg: '#0e2a1a', text: '#72c142', border: '#2e5c36', dot: '#72c142', icon: '🏆' },
  FAILED:       { label: 'Failed',      bg: '#2a0e0e', text: '#ff6b6b', border: '#5a1e1e', dot: '#ff6b6b', icon: '❌' },
  CANCELLED:    { label: 'Cancelled',   bg: '#2a0e0e', text: '#ff6b6b', border: '#5a1e1e', dot: '#ff6b6b', icon: '🚫' },
};

const STATUS_ORDER = [
  'scheduled','confirmed','ASSIGNED','ACCEPTED',
  'in-progress','IN_PROGRESS','completed','COMPLETED',
  'cancelled','CANCELLED','no-show','FAILED',
];

const getMeta = (s: string) => STATUS_META[s] ?? STATUS_META['scheduled'];

// ─── Inline styles helper (for dynamic values only) ──────────────────────────
const css = (obj: React.CSSProperties): React.CSSProperties => obj;

// ─── Sub-components ──────────────────────────────────────────────────────────

const PulsingDot = ({ color }: { color: string }) => (
  <span style={css({
    display: 'inline-block',
    width: 8, height: 8,
    borderRadius: '50%',
    backgroundColor: color,
    boxShadow: `0 0 6px ${color}`,
    flexShrink: 0,
    animation: 'pulse 2s ease-in-out infinite',
  })} />
);

const StatusPill = ({ status }: { status: string }) => {
  const m = getMeta(status);
  return (
    <span style={css({
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
      textTransform: 'uppercase',
      backgroundColor: m.bg,
      color: m.text,
      border: `1px solid ${m.border}`,
      whiteSpace: 'nowrap',
      flexShrink: 0,
    })}>
      <PulsingDot color={m.dot} />
      {m.label}
    </span>
  );
};

const InfoChip = ({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: string }) => (
  <div style={css({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 12px',
    background: G.surface,
    border: `1px solid ${G.border}`,
    borderRadius: 10,
    minWidth: 0,
  })}>
    <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 10, color: G.muted, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: accent ?? G.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  </div>
);

const SessionCard = ({ session, onClick }: { session: Session; onClick: () => void }) => {
  const m = getMeta(session.status);
  const start = new Date(session.startTime);
  const end   = new Date(session.endTime);
  const day   = start.toLocaleDateString('en-US', { weekday: 'short' });
  const date  = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const t1    = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const t2    = end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const durationMs = end.getTime() - start.getTime();
  const durationMins = Math.round(durationMs / 60000);

  return (
    <div
      onClick={onClick}
      className="session-card"
      style={css({
        background: G.card,
        border: `1.5px solid ${G.border}`,
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.22s ease',
        position: 'relative',
      })}
    >
      {/* Left accent bar */}
      <div style={css({
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: `linear-gradient(180deg, ${m.border}, ${m.dot})`,
        borderRadius: '16px 0 0 16px',
      })} />

      <div style={{ padding: '14px 16px 14px 20px' }}>
        {/* Header row */}
        <div style={css({ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 })}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Date strip */}
            <div style={css({ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 })}>
              <div style={css({
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                background: G.surface, border: `1px solid ${G.border}`,
                borderRadius: 8, padding: '4px 8px', flexShrink: 0,
              })}>
                <span style={{ fontSize: 9, color: G.muted, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{day}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: G.lime, lineHeight: 1.1 }}>{start.getDate()}</span>
                <span style={{ fontSize: 9, color: G.muted }}>{start.toLocaleDateString('en-US', { month: 'short' })}</span>
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: G.text, lineHeight: 1.3 }}>{session.title}</h4>
                {session.description && (
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: G.muted, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {session.description}
                  </p>
                )}
              </div>
            </div>
          </div>
          <StatusPill status={session.status} />
        </div>

        {/* Info chips grid */}
        <div style={css({ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 6, marginBottom: 10 })}>
          <InfoChip icon="⏰" label="Time" value={`${t1} – ${t2}`} />
          <InfoChip icon="⌛" label="Duration" value={`${durationMins} min`} accent={G.accent} />
          <InfoChip icon="👨‍🏫" label="Coach" value={session.coach.name} />
          {session.court && (
            <InfoChip icon="🎾" label="Court" value={`${session.court.name}${session.court.courtNumber ? ` #${session.court.courtNumber}` : ''}`} />
          )}
          <InfoChip icon="📋" label="Type" value={session.sessionType.replace(/-/g, ' ').toUpperCase()} />
          {session.price != null && (
            <InfoChip icon="💰" label="Price" value={`KSh ${session.price.toLocaleString()}`} accent={G.lime} />
          )}
        </div>

        {/* Booking details */}
        {session.booking && (
          <div style={css({
            background: G.surface, border: `1px solid ${G.border}`,
            borderRadius: 8, padding: '8px 12px',
            display: 'flex', flexWrap: 'wrap', gap: 12,
            marginBottom: 8,
          })}>
            <span style={{ fontSize: 11, color: G.muted, fontWeight: 600 }}>Booking: <span style={{ color: G.text }}>{session.booking.status}</span></span>
            {session.booking.attendanceStatus && (
              <span style={{ fontSize: 11, color: G.muted, fontWeight: 600 }}>Attendance: <span style={{ color: G.text }}>{session.booking.attendanceStatus}</span></span>
            )}
            {session.booking.feedbackRating && (
              <span style={{ fontSize: 11, color: G.muted, fontWeight: 600 }}>Rating: <span style={{ color: G.yellow }}>{'⭐'.repeat(Math.round(session.booking.feedbackRating))} {session.booking.feedbackRating}/5</span></span>
            )}
          </div>
        )}

        {/* Direct assignment badge */}
        {session.isDirectAssignment && (
          <div style={css({ display: 'flex', alignItems: 'center', gap: 6 })}>
            <span style={css({
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 600, color: G.lime,
              background: `${G.glow}`, border: `1px solid ${G.border}`,
              borderRadius: 20, padding: '3px 10px',
            })}>
              <span>✦</span> Direct coach assignment
            </span>
          </div>
        )}
      </div>

      {/* Footer arrow hint */}
      <div style={css({
        borderTop: `1px solid ${G.border}`,
        padding: '7px 16px 7px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: G.surface,
      })}>
        <span style={{ fontSize: 11, color: G.muted }}>Tap to view details</span>
        <span style={{ fontSize: 13, color: G.lime }}>→</span>
      </div>
    </div>
  );
};

const TaskCard = ({ task, onClick }: { task: Task; onClick: () => void }) => {
  const m = getMeta(task.status);
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date() && task.status !== 'COMPLETED' && task.status !== 'FAILED';
  const progress = task.status === 'COMPLETED' ? 100 : task.status === 'IN_PROGRESS' ? 55 : task.status === 'ACCEPTED' ? 25 : 10;

  return (
    <div
      onClick={onClick}
      className="session-card"
      style={css({
        background: G.card,
        border: `1.5px solid ${G.border}`,
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.22s ease',
        position: 'relative',
      })}
    >
      {/* Left accent bar with gradient */}
      <div style={css({
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: `linear-gradient(180deg, ${m.border}, ${m.dot})`,
        borderRadius: '16px 0 0 16px',
      })} />

      <div style={{ padding: '14px 16px 14px 20px' }}>
        {/* Header */}
        <div style={css({ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 })}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={css({ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 })}>
              <span style={{ fontSize: 20 }}>📋</span>
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: G.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.template.name}
              </h4>
            </div>
            {task.template.description && (
              <p style={{ margin: 0, fontSize: 12, color: G.muted, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {task.template.description}
              </p>
            )}
          </div>
          <StatusPill status={task.status} />
        </div>

        {/* Progress bar */}
        <div style={css({ marginBottom: 10 })}>
          <div style={css({ display: 'flex', justifyContent: 'space-between', marginBottom: 4 })}>
            <span style={{ fontSize: 10, color: G.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Progress</span>
            <span style={{ fontSize: 10, color: m.text, fontWeight: 700 }}>{progress}%</span>
          </div>
          <div style={css({ height: 4, background: G.surface, borderRadius: 4, overflow: 'hidden', border: `1px solid ${G.border}` })}>
            <div style={css({
              height: '100%',
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${m.border}, ${m.dot})`,
              borderRadius: 4,
              transition: 'width 0.6s ease',
              boxShadow: `0 0 6px ${m.dot}`,
            })} />
          </div>
        </div>

        {/* Info chips */}
        <div style={css({ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 6, marginBottom: 10 })}>
          <InfoChip icon="👤" label="Assigned To" value={`${task.assignedToUser.firstName} ${task.assignedToUser.lastName}`} />
          <InfoChip icon="📂" label="Type" value={task.template.type} />
          {dueDate && (
            <InfoChip icon="📅" label="Due Date" value={`${dueDate.toLocaleDateString()}${isOverdue ? ' ⚠️' : ''}`} accent={isOverdue ? G.red : undefined} />
          )}
        </div>

        {isOverdue && (
          <div style={css({
            background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.3)',
            borderRadius: 8, padding: '6px 12px', marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 6,
          })}>
            <span style={{ fontSize: 12 }}>⚠️</span>
            <span style={{ fontSize: 11, color: G.red, fontWeight: 600 }}>This task is overdue</span>
          </div>
        )}

        {task.notes && (
          <div style={css({
            background: G.surface, border: `1px solid ${G.border}`,
            borderRadius: 8, padding: '8px 12px', marginBottom: 8,
          })}>
            <div style={{ fontSize: 10, color: G.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Notes</div>
            <div style={{ fontSize: 12, color: G.textSub }}>{task.notes}</div>
          </div>
        )}
      </div>

      <div style={css({
        borderTop: `1px solid ${G.border}`,
        padding: '7px 16px 7px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: G.surface,
      })}>
        <span style={{ fontSize: 11, color: G.muted }}>Tap to view full details</span>
        <span style={{ fontSize: 13, color: G.lime }}>→</span>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
export const SessionsView: React.FC<SessionsViewProps> = ({ isEmbedded = false, playerId = '' }) => {
  const params = useParams();
  const router = useRouter();
  const role = (params?.role as string) || 'player';
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'sessions' | 'tasks'>('all');

  useEffect(() => {
    const fetchData = async () => {
      if (!playerId) { setError('Player ID is required'); setLoading(false); return; }
      try {
        const [sessionsRes, tasksRes] = await Promise.all([
          fetch(`/api/players/sessions?playerId=${playerId}`),
          fetch(`/api/players/tasks?playerId=${playerId}`),
        ]);
        if (!sessionsRes.ok) throw new Error('Failed to fetch sessions');
        const sessionsData = await sessionsRes.json();
        setSessions((sessionsData.sessions || []).map((s: any) => ({ ...s, type: 'session' as const })));
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setTasks((tasksData.tasks || []).map((t: any) => ({ ...t, type: 'task' as const })));
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sessions');
        setSessions([]); setTasks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [playerId]);

  if (loading) return <LoadingState icon="📅" message="Loading your sessions and tasks..." />;

  if (error) return (
    <div style={css({ background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, padding: 24, color: G.text, textAlign: 'center' })}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
      <div style={{ color: G.red }}>{error}</div>
    </div>
  );

  const combined: (Session | Task)[] =
    activeTab === 'all' ? [...sessions, ...tasks] :
    activeTab === 'sessions' ? sessions : tasks;

  const grouped = combined.reduce((acc, item) => {
    const s = item.type === 'session' ? (item as Session).status : (item as Task).status;
    acc[s] = acc[s] ? [...acc[s], item] : [item];
    return acc;
  }, {} as Record<string, (Session | Task)[]>);

  const sortedStatuses = Object.keys(grouped).sort(
    (a, b) => STATUS_ORDER.indexOf(a) - STATUS_ORDER.indexOf(b)
  );

  const visibleItems = selectedStatus ? (grouped[selectedStatus] || []) : combined;

  return (
    <>
      {/* Scoped keyframe + hover styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .session-card:hover {
          border-color: ${G.borderBright} !important;
          background: ${G.cardHover} !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${G.borderBright};
        }
        .tab-btn:hover { opacity: 0.85; }
        .filter-btn:hover { border-color: ${G.borderBright} !important; }
        .fade-in { animation: fadeSlideIn 0.3s ease both; }
      `}</style>

      <div style={css({ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: "'Inter', sans-serif" })}>

        {/* ── Header card ── */}
        <div style={css({
          background: `linear-gradient(145deg, ${G.surface} 0%, ${G.card} 100%)`,
          border: `1px solid ${G.border}`,
          borderRadius: 20,
          overflow: 'hidden',
        })}>
          {/* Top bar with title */}
          <div style={css({
            padding: '16px 20px 0',
            backgroundImage: `radial-gradient(ellipse at top right, rgba(114,193,66,0.07) 0%, transparent 60%)`,
          })}>
            <div style={css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 })}>
              <div style={css({ display: 'flex', alignItems: 'center', gap: 10 })}>
                <div style={css({
                  width: 38, height: 38, borderRadius: 10,
                  background: `linear-gradient(135deg, ${G.mid}, ${G.bright})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, boxShadow: `0 0 16px ${G.glow}`,
                })}>📅</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: G.text }}>Sessions & Tasks</h2>
                  <p style={{ margin: 0, fontSize: 11, color: G.muted }}>
                    {sessions.length} session{sessions.length !== 1 ? 's' : ''} · {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Type tabs */}
            <div style={css({ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' })}>
              {(['all', 'sessions', 'tasks'] as const).map(tab => {
                const count = tab === 'all' ? combined.length : tab === 'sessions' ? sessions.length : tasks.length;
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    className="tab-btn"
                    onClick={() => { setActiveTab(tab); setSelectedStatus(null); }}
                    style={css({
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '7px 16px', borderRadius: 30, border: 'none',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: active ? G.lime : G.surface,
                      color: active ? G.bg : G.muted,
                      boxShadow: active ? `0 0 12px ${G.glow}` : 'none',
                    })}
                  >
                    {tab === 'sessions' ? '📅' : tab === 'tasks' ? '📋' : '◉'}
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    <span style={css({
                      background: active ? 'rgba(7,18,10,0.3)' : G.border,
                      borderRadius: 20, padding: '1px 7px',
                      fontSize: 11, fontWeight: 800,
                      color: active ? G.bg : G.textSub,
                    })}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status filter chips – horizontal scroll */}
          <div style={css({ padding: '0 20px 16px', overflowX: 'auto' })}>
            <div style={css({ display: 'flex', gap: 6, width: 'max-content' })}>
              {/* All chip */}
              <button
                type="button"
                className="filter-btn"
                onClick={() => setSelectedStatus(null)}
                style={css({
                  padding: '5px 14px', borderRadius: 20, cursor: 'pointer', border: '1px solid',
                  fontSize: 12, fontWeight: 700, transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                  background: selectedStatus === null ? G.bright : G.surface,
                  color: selectedStatus === null ? G.text : G.muted,
                  borderColor: selectedStatus === null ? G.lime : G.border,
                  boxShadow: selectedStatus === null ? `0 0 8px ${G.glow}` : 'none',
                })}
              >
                All · {combined.length}
              </button>

              {sortedStatuses.map(s => {
                const m = getMeta(s);
                const active = selectedStatus === s;
                return (
                  <button
                    key={s}
                    type="button"
                    className="filter-btn"
                    onClick={() => setSelectedStatus(s)}
                    style={css({
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '5px 14px', borderRadius: 20, cursor: 'pointer', border: '1px solid',
                      fontSize: 12, fontWeight: 700, transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                      background: active ? m.bg : G.surface,
                      color: active ? m.text : G.muted,
                      borderColor: active ? m.border : G.border,
                    })}
                  >
                    <PulsingDot color={m.dot} />
                    {m.label} · {grouped[s].length}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Empty state ── */}
        {visibleItems.length === 0 && (
          <div style={css({
            background: G.card, border: `1px solid ${G.border}`,
            borderRadius: 20, padding: '40px 24px', textAlign: 'center',
          })}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🎾</div>
            <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: G.text }}>Nothing here yet</h3>
            <p style={{ margin: 0, fontSize: 13, color: G.muted }}>No sessions or tasks match this filter. Ask your coach to schedule one!</p>
          </div>
        )}

        {/* ── Cards list ── */}
        {sortedStatuses.map(status => {
          const items = grouped[status] ?? [];
          if (items.length === 0) return null;
          if (selectedStatus && selectedStatus !== status) return null;

          return (
            <div key={status}>
              {/* Group label (only when showing all) */}
              {selectedStatus === null && (
                <div style={css({ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 })}>
                  <PulsingDot color={getMeta(status).dot} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: G.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {getMeta(status).label}
                  </span>
                  <div style={{ flex: 1, height: 1, background: G.border }} />
                </div>
              )}

              <div style={css({ display: 'flex', flexDirection: 'column', gap: 8 })}>
                {items.map((item, i) => {
                  const style = { animationDelay: `${i * 50}ms` };
                  if (item.type === 'session') {
                    return (
                      <div key={item.id} className="fade-in" style={style}>
                        <SessionCard
                          session={item as Session}
                          onClick={() => router.push(`/dashboard/${role}/${playerId}/session/${item.id}?sessions=true`)}
                        />
                      </div>
                    );
                  }
                  return (
                    <div key={item.id} className="fade-in" style={style}>
                      <TaskCard
                        task={item as Task}
                        onClick={() => {
                          toast('Navigating to task details…', { duration: 2000 });
                          router.push(`/dashboard/${role}/${playerId}/task/${item.id}?sessions=true`);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};