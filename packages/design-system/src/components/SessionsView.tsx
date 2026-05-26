'use client';

import type { ReactNode } from 'react';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';
import { radii } from '../tokens/radius';
import { SessionCard } from './SessionCard';

export interface Session {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  sessionType: 'group' | '1-on-1' | 'clinic' | string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | string;
  court?: string;
  price?: number;
  bookings: Array<{ playerName?: string }>;
  maxParticipants: number;
  date?: string;
  isPast?: boolean;
}

export interface SessionsViewProps {
  sessions: Session[];
  loading?: boolean;
  onCreateSession?: () => void;
  onViewDetails?: (sessionId: string, title: string) => void;
  onEditSession?: (session: Session) => void;
  onDeleteSession?: (sessionId: string) => void;
  title?: string;
  subtitle?: string;
  showStats?: boolean;
  actions?: ReactNode;
}

const SectionLabel: React.FC<{ children: ReactNode; action?: ReactNode }> = ({ children, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
    <span
      style={{
        fontSize: typography.fontSize.caption,
        fontWeight: typography.fontWeight.extraBold,
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        color: colors.primary,
        fontFamily: typography.fontFamily.display.join(', '),
      }}
    >
      {children}
    </span>
    {action && <span style={{ fontSize: typography.fontSize.caption, color: colors.textMuted, cursor: 'pointer' }}>{action}</span>}
  </div>
);

const StatCard: React.FC<{ label: string; value: string | number; color?: string }> = ({
  label,
  value,
  color = colors.primary,
}) => (
  <div
    style={{
      background: colors.surfaceAccent,
      border: `1px solid ${colors.border}`,
      borderRadius: radii.md,
      padding: spacing.md,
    }}
  >
    <div
      style={{
        fontSize: '8px',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        fontFamily: typography.fontFamily.display.join(', '),
        fontWeight: typography.fontWeight.extraBold,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: '20px',
        fontWeight: typography.fontWeight.extraBold,
        color,
        marginTop: spacing.sm,
        lineHeight: 1,
        fontFamily: typography.fontFamily.display.join(', '),
      }}
    >
      {value}
    </div>
  </div>
);

export const SessionsView: React.FC<SessionsViewProps> = ({
  sessions,
  loading = false,
  onCreateSession,
  onViewDetails,
  onEditSession,
  onDeleteSession,
  title = '📅 My Sessions',
  subtitle = 'Create and manage coaching sessions',
  showStats = true,
  actions,
}) => {
  const summaryStats = {
    upcoming: sessions.filter((s) => new Date(s.startTime) >= new Date()).length,
    oneOnOne: sessions.filter((s) => s.sessionType === '1-on-1').length,
    group: sessions.filter((s) => s.sessionType !== '1-on-1').length,
    revenue: sessions.reduce((a, s) => a + (s.price || 0) * s.bookings.length, 0),
  };

  const sessionTypeColors: Record<string, string> = {
    '1-on-1': colors.primary,
    group: colors.info,
    clinic: colors.warning,
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.lg,
          padding: spacing.lg,
          textAlign: 'center',
          color: colors.textMuted,
        }}
      >
        Loading sessions...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: spacing.lg }}>
        <div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: typography.fontWeight.extraBold,
              color: colors.textPrimary,
              fontFamily: typography.fontFamily.display.join(', '),
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: typography.fontSize.caption,
              color: colors.textMuted,
              marginTop: spacing.xs,
              fontFamily: typography.fontFamily.body.join(', '),
            }}
          >
            {subtitle}
          </div>
        </div>
        <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
          {actions}
          {onCreateSession && (
            <button
              onClick={onCreateSession}
              style={{
                background: colors.primary,
                color: colors.background,
                border: 'none',
                borderRadius: radii.sm,
                padding: `${spacing.xs} ${spacing.md}`,
                fontWeight: typography.fontWeight.extraBold,
                fontSize: typography.fontSize.caption,
                cursor: 'pointer',
                fontFamily: typography.fontFamily.body.join(', '),
              }}
            >
              + Create Session
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {showStats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: spacing.md,
          }}
        >
          <StatCard label="Upcoming" value={summaryStats.upcoming} color={colors.primary} />
          <StatCard label="1-on-1" value={summaryStats.oneOnOne} color={colors.primary} />
          <StatCard label="Group" value={summaryStats.group} color={colors.info} />
          <StatCard label="Revenue Est." value={`$${summaryStats.revenue}`} color={colors.warning} />
        </div>
      )}

      {/* Session List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {sessions.length === 0 ? (
          <div
            style={{
              background: colors.surfaceAccent,
              border: `1px solid ${colors.border}`,
              borderRadius: radii.md,
              textAlign: 'center',
              color: colors.textMuted,
              padding: spacing.xl,
            }}
          >
            No sessions yet. Create your first session to get started.
          </div>
        ) : (
          sessions.map((session) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const activityDate = session.date ? new Date(`${session.date}T00:00:00Z`) : new Date(session.startTime);
            const isPast = activityDate < today;
            const typeColor = sessionTypeColors[session.sessionType] || colors.primary;
            const isFull = session.bookings.length >= session.maxParticipants;

            return (
              <SessionCard
                key={session.id}
                title={session.title}
                description={session.description}
                startTime={session.startTime}
                endTime={session.endTime}
                sessionType={session.sessionType}
                status={session.status}
                court={session.court}
                price={session.price}
                bookings={session.bookings.length}
                maxParticipants={session.maxParticipants}
                isPast={isPast}
                isFull={isFull}
                onClick={() => onViewDetails?.(session.id, session.title)}
                onEdit={() => onEditSession?.(session)}
                onDelete={() => onDeleteSession?.(session.id)}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
