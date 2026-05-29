'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from '@vico/design-system';
import { LoadingState } from '@/components/LoadingState';
import { Card, Button, colors, spacing, typography, radii, toastOptions } from '@vico/design-system';

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
  bg:         '#0a180a',
  surface:    '#162616',
  card:       '#162616',
  cardHover:  '#1b2f1b',
  border:     '#243e24',
  borderBright: '#326832',
  mid:        '#2a5224',
  bright:     '#3a7230',
  lime:       '#79bf3e',
  accent:     '#a8d84e',
  glow:       'rgba(125,193,66,0.18)',
  text:       '#e4f2da',
  textSub:    '#c2dbb0',
  muted:      '#5e8e50',
  yellow:     '#efc040',
  red:        '#d94f4f',
  blue:       '#4a9eff',
};

const STATUS_META: Record<string, { label: string; bg: string; text: string; border: string; dot: string; icon: string }> = {
  scheduled:    { label: 'Scheduled',   bg: G.surface, text: G.lime, border: G.border, dot: G.lime, icon: '🟢' },
  confirmed:    { label: 'Confirmed',   bg: G.surface, text: G.blue, border: G.border, dot: G.blue, icon: '🔵' },
  'in-progress':{ label: 'In Progress', bg: G.surface, text: G.yellow, border: G.border, dot: G.yellow, icon: '🟡' },
  completed:    { label: 'Completed',   bg: G.surface, text: G.lime, border: G.border, dot: G.lime, icon: '✅' },
  cancelled:    { label: 'Cancelled',   bg: G.surface, text: G.red, border: G.border, dot: G.red, icon: '🔴' },
  'no-show':    { label: 'No Show',     bg: G.surface, text: G.yellow, border: G.border, dot: G.yellow, icon: '🟠' },
  ASSIGNED:     { label: 'Assigned',    bg: G.surface, text: G.blue, border: G.border, dot: G.blue, icon: '📌' },
  ACCEPTED:     { label: 'Accepted',    bg: G.surface, text: G.lime, border: G.border, dot: G.lime, icon: '✅' },
  IN_PROGRESS:  { label: 'In Progress', bg: G.surface, text: G.yellow, border: G.border, dot: G.yellow, icon: '⚡' },
  COMPLETED:    { label: 'Completed',   bg: G.surface, text: G.lime, border: G.border, dot: G.lime, icon: '🏆' },
  FAILED:       { label: 'Failed',      bg: G.surface, text: G.red, border: G.border, dot: G.red, icon: '❌' },
  CANCELLED:    { label: 'Cancelled',   bg: G.surface, text: G.red, border: G.border, dot: G.red, icon: '🚫' },
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

const SessionCard = ({ session, onClick }: { session: Session; onClick: () => void }) => {
  const m = getMeta(session.status);
  const start = new Date(session.startTime);
  const end   = new Date(session.endTime);
  const t1    = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const t2    = end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      onClick={onClick}
      className="session-card"
      style={{
        background: G.card,
        border: `1px solid ${G.border}`,
        borderRadius: radii.md,
        padding: spacing.md,
        borderLeft: `3px solid ${m.dot}`,
        transition: 'all 0.15s ease',
        opacity: session.status === 'completed' || session.status === 'COMPLETED' ? 0.75 : 1,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xs }}>
            <span style={{ fontSize: typography.fontSize.label, fontWeight: typography.fontWeight.extraBold, color: G.text, fontFamily: typography.fontFamily.body.join(', ') }}>
              {session.title}
            </span>
          </div>
          {session.description && (
            <p style={{ fontSize: typography.fontSize.caption, color: G.muted, marginBottom: spacing.md, lineHeight: typography.lineHeight.normal, fontFamily: typography.fontFamily.body.join(', ') }}>
              {session.description}
            </p>
          )}
          <div style={{ display: 'flex', gap: spacing.lg, fontSize: typography.fontSize.caption, color: G.textSub, marginBottom: spacing.md, flexWrap: 'wrap', fontFamily: typography.fontFamily.body.join(', ') }}>
            <span>🕐 {t1} – {t2}</span>
            {session.coach && <span>👨‍🏫 {session.coach.name}</span>}
            {session.court && <span>📍 {typeof session.court === 'string' ? session.court : session.court.name}</span>}
          </div>
          <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap', alignItems: 'center', fontFamily: typography.fontFamily.body.join(', ') }}>
            <span style={{ fontSize: typography.fontSize.caption, fontWeight: typography.fontWeight.extraBold, borderRadius: radii.sm, padding: `${spacing.xs} ${spacing.sm}`, background: G.surface, color: m.text }}>
              {session.sessionType}
            </span>
            <span style={{ fontSize: typography.fontSize.caption, fontWeight: typography.fontWeight.extraBold, borderRadius: radii.sm, padding: `${spacing.xs} ${spacing.sm}`, background: G.surface, color: m.text }}>
              {m.label}
            </span>
            {session.price && (
              <span style={{ fontSize: typography.fontSize.caption, fontWeight: typography.fontWeight.extraBold, borderRadius: radii.sm, padding: `${spacing.xs} ${spacing.sm}`, background: G.surface, color: G.yellow }}>
                ${session.price}/player
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer arrow */}
      <div style={{ padding: `${spacing.md} 0 0`, marginTop: spacing.md, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: typography.fontSize.caption, color: G.textSub, fontFamily: typography.fontFamily.body.join(', ') }}>
        <span>Tap to view details</span>
        <span style={{ color: G.lime }}>→</span>
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
      style={{
        background: G.card,
        border: `1px solid ${G.border}`,
        borderRadius: radii.md,
        padding: spacing.md,
        borderLeft: `3px solid ${m.dot}`,
        transition: 'all 0.15s ease',
        opacity: task.status === 'COMPLETED' || task.status === 'FAILED' ? 0.75 : 1,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.md }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm }}>
            <span style={{ fontSize: '18px' }}>📋</span>
            <h4 style={{ margin: 0, fontSize: typography.fontSize.label, fontWeight: typography.fontWeight.extraBold, color: G.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: typography.fontFamily.body.join(', ') }}>
              {task.template.name}
            </h4>
          </div>
          {task.template.description && (
            <p style={{ margin: 0, fontSize: typography.fontSize.caption, color: G.muted, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontFamily: typography.fontFamily.body.join(', ') }}>
              {task.template.description}
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: spacing.md, fontFamily: typography.fontFamily.body.join(', ') }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <span style={{ fontSize: typography.fontSize.caption, color: G.textSub, fontWeight: typography.fontWeight.extraBold, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Progress</span>
          <span style={{ fontSize: typography.fontSize.caption, color: m.text, fontWeight: typography.fontWeight.extraBold }}>{progress}%</span>
        </div>
        <div style={{ height: 4, background: G.surface, borderRadius: radii.sm, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: m.dot, borderRadius: radii.sm, transition: 'width 0.6s ease' }} />
        </div>
      </div>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: spacing.sm, marginBottom: spacing.md, fontFamily: typography.fontFamily.body.join(', ') }}>
        <div style={{ background: G.surface, borderRadius: radii.sm, padding: spacing.sm }}>
          <div style={{ fontSize: '8px', color: G.muted, fontWeight: typography.fontWeight.extraBold, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: spacing.xs }}>Type</div>
          <div style={{ fontSize: typography.fontSize.caption, fontWeight: typography.fontWeight.bold, color: G.text }}>{task.template.type}</div>
        </div>
        {dueDate && (
          <div style={{ background: G.surface, borderRadius: radii.sm, padding: spacing.sm }}>
            <div style={{ fontSize: typography.fontSize.caption, fontWeight: typography.fontWeight.bold, color: isOverdue ? G.red : G.text }}>{dueDate.toLocaleDateString()} {isOverdue ? '⚠️' : ''}</div>
          </div>
        )}
      </div>

      {isOverdue && (
        <div style={{ background: `${G.red}22`, borderRadius: radii.sm, padding: `${spacing.sm} ${spacing.md}`, marginBottom: spacing.md, display: 'flex', alignItems: 'center', gap: spacing.sm, fontFamily: typography.fontFamily.body.join(', ') }}>
          <span style={{ fontSize: '14px' }}>⚠️</span>
          <span style={{ fontSize: typography.fontSize.caption, color: G.red, fontWeight: typography.fontWeight.bold }}>This task is overdue</span>
        </div>
      )}

      {task.notes && (
        <div style={{ background: G.surface, borderRadius: radii.sm, padding: spacing.md, marginBottom: spacing.md, fontFamily: typography.fontFamily.body.join(', ') }}>
          <div style={{ fontSize: typography.fontSize.caption, color: G.textSub, fontWeight: typography.fontWeight.extraBold, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: spacing.xs }}>Notes</div>
          <div style={{ fontSize: typography.fontSize.caption, color: G.textSub }}>{task.notes}</div>
        </div>
      )}

      {/* Footer */}
      <div style={{ paddingTop: spacing.md, marginTop: spacing.md, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: typography.fontSize.caption, color: G.textSub, fontFamily: typography.fontFamily.body.join(', ') }}>
        <span>Tap to view full details</span>
        <span style={{ color: G.lime }}>→</span>
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
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'completed'>('all');

  const isCompletedStatus = (status: string) => [
    'completed', 'COMPLETED', 'FAILED', 'FAILED', 'cancelled', 'CANCELLED', 'no-show', 'NO-SHOW',
  ].includes(status);

  const summaryStats = {
    upcoming: sessions.filter((session) => !isCompletedStatus(session.status)).length,
    oneOnOne: sessions.filter((session) => session.sessionType === '1-on-1').length,
    group: sessions.filter((session) => session.sessionType !== '1-on-1').length,
    revenue: sessions.reduce((total, session) => total + (session.price || 0), 0),
  };

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

  const combined: (Session | Task)[] = [...sessions, ...tasks];
  const totalItems = combined.length;

  const filteredItems = combined.filter((item) => {
    const status = item.type === 'session' ? (item as Session).status : (item as Task).status;
    if (activeTab === 'all') return true;
    if (activeTab === 'upcoming') return !isCompletedStatus(status);
    return isCompletedStatus(status);
  });

  return (
    <>
      {/* Scoped keyframe styles */}
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
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.32);
        }
        .fade-in { animation: fadeSlideIn 0.3s ease both; }
      `}</style>

      <div style={css({ display: 'flex', flexDirection: 'column', gap: spacing.lg })}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap', padding: `${spacing.xs} 0` }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: G.text, fontFamily: typography.fontFamily.display.join(', ') }}>
              📅 My Sessions & Tasks
            </div>
            <div style={{ fontSize: typography.fontSize.caption, color: G.muted, marginTop: spacing.xs, fontFamily: typography.fontFamily.body.join(', ') }}>
              Manage your coaching sessions and task assignments
            </div>
          </div>
          <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: G.cardHover, border: `1px solid ${G.border}`, borderRadius: radii.full, padding: `${spacing.xs} ${spacing.sm}`, color: G.textSub, fontSize: typography.fontSize.caption, fontWeight: typography.fontWeight.extraBold, fontFamily: typography.fontFamily.body.join(', ') }}>
              {totalItems} total
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(180px, 1fr))', gap: spacing.md }}>
          {[
            { label: 'Upcoming', value: summaryStats.upcoming, color: G.lime },
            { label: '1-on-1', value: summaryStats.oneOnOne, color: G.lime },
            { label: 'Group', value: summaryStats.group, color: G.blue },
            { label: 'Revenue Est.', value: `$${summaryStats.revenue}`, color: G.yellow },
          ].map((stat) => (
            <div key={stat.label} style={{ background: G.cardHover, border: `1px solid ${G.border}`, borderRadius: radii.md, padding: spacing.md, minHeight: 104, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '8px', color: G.muted, textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: typography.fontFamily.display.join(', '), fontWeight: typography.fontWeight.extraBold }}>{stat.label}</div>
              <div style={{ fontSize: '24px', fontWeight: typography.fontWeight.extraBold, color: stat.color, lineHeight: 1, fontFamily: typography.fontFamily.display.join(', ') }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr)) auto', alignItems: 'center', gap: spacing.sm, background: G.card, border: `1px solid ${G.border}`, borderRadius: radii.md, padding: `${spacing.sm} ${spacing.md}` }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              width: '100%',
              padding: `${spacing.sm} ${spacing.md}`,
              minHeight: 44,
              borderRadius: radii.full,
              border: 'none',
              background: activeTab === 'all' ? G.lime : G.surface,
              color: activeTab === 'all' ? '#0a180a' : G.textSub,
              fontSize: typography.fontSize.caption,
              fontWeight: typography.fontWeight.extraBold,
              cursor: 'pointer',
              fontFamily: typography.fontFamily.body.join(', '),
            }}
          >
            All
          </button>

          <button
            onClick={() => setActiveTab('upcoming')}
            style={{
              width: '100%',
              padding: `${spacing.sm} ${spacing.md}`,
              minHeight: 44,
              borderRadius: radii.full,
              border: 'none',
              background: activeTab === 'upcoming' ? G.lime : G.surface,
              color: activeTab === 'upcoming' ? '#0a180a' : G.textSub,
              fontSize: typography.fontSize.caption,
              fontWeight: typography.fontWeight.extraBold,
              cursor: 'pointer',
              fontFamily: typography.fontFamily.body.join(', '),
            }}
          >
            Upcoming
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            style={{
              width: '100%',
              padding: `${spacing.sm} ${spacing.md}`,
              minHeight: 44,
              borderRadius: radii.full,
              border: 'none',
              background: activeTab === 'completed' ? G.lime : G.surface,
              color: activeTab === 'completed' ? '#0a180a' : G.textSub,
              fontSize: typography.fontSize.caption,
              fontWeight: typography.fontWeight.extraBold,
              cursor: 'pointer',
              fontFamily: typography.fontFamily.body.join(', '),
            }}
          >
            Completed
          </button>
          <button
            type="button"
            onClick={() => toast('Filters coming soon', { ...toastOptions, duration: 1500 })}
            style={{
              minHeight: 44,
              padding: `${spacing.sm} ${spacing.md}`,
              borderRadius: radii.full,
              border: `1px solid ${G.border}`,
              background: G.surface,
              color: G.text,
              cursor: 'pointer',
              fontSize: typography.fontSize.caption,
              fontWeight: typography.fontWeight.extraBold,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              fontFamily: typography.fontFamily.body.join(', '),
            }}
          >
            ⚙ Filters
          </button>
        </div>

        {filteredItems.length === 0 && (
          <div style={{ background: G.cardHover, borderRadius: radii.md, textAlign: 'center', color: G.textSub, padding: spacing.xl }}>
            <div style={{ fontSize: '44px', marginBottom: spacing.md }}>🎾</div>
            <h3 style={{ margin: 0, fontSize: typography.fontSize.h4, fontWeight: typography.fontWeight.extraBold, color: G.text }}>
              Nothing here yet
            </h3>
            <p style={{ margin: spacing.sm + ' 0 0', fontSize: typography.fontSize.body, color: G.textSub }}>
              No sessions or tasks match this filter. Ask your coach to schedule one!
            </p>
          </div>
        )}

        {/* Items list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {filteredItems.length === 0 ? null : filteredItems.map((item, i) => {
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
                    toast('Navigating to task details…', { ...toastOptions, duration: 2000 });
                    router.push(`/dashboard/${role}/${playerId}/task/${item.id}?sessions=true`);
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};