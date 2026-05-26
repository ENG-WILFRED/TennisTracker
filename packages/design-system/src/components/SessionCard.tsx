import type { HTMLAttributes, ReactNode } from 'react';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';

export interface SessionCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  startTime: string; // ISO datetime or formatted string
  endTime: string; // ISO datetime or formatted string
  sessionType: 'group' | '1-on-1' | 'clinic' | string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | string;
  court?: string;
  price?: number;
  bookings?: number;
  maxParticipants?: number;
  isPast?: boolean;
  isFull?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  actions?: ReactNode;
}

const formatDateTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month} ${day}, ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
};

const getSessionTypeColor = (type: string): string => {
  switch (type.toLowerCase()) {
    case '1-on-1':
      return colors.primary;
    case 'group':
      return colors.info;
    case 'clinic':
      return colors.warning;
    default:
      return colors.primary;
  }
};

export const SessionCard = ({
  title,
  description,
  startTime,
  endTime,
  sessionType,
  status,
  court,
  price,
  bookings = 0,
  maxParticipants = 0,
  isPast = false,
  isFull = false,
  onEdit,
  onDelete,
  actions,
  style,
  onMouseEnter,
  onMouseLeave,
  onClick,
  ...rest
}: SessionCardProps) => {
  const typeColor = getSessionTypeColor(sessionType);
  const fillPct = maxParticipants > 0 ? (bookings / maxParticipants) * 100 : 0;

  const Tag = ({
    children,
    bgColor,
    textColor,
  }: {
    children: ReactNode;
    bgColor: string;
    textColor: string;
  }) => (
    <span
      style={{
        fontSize: typography.fontSize.caption,
        fontWeight: typography.fontWeight.extraBold,
        borderRadius: spacing.xs,
        padding: `${spacing.xs} ${spacing.sm}`,
        background: `${bgColor}22`,
        border: `1px solid ${bgColor}44`,
        color: textColor,
        display: 'inline-block',
        fontFamily: typography.fontFamily.body.join(', '),
      }}
    >
      {children}
    </span>
  );

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        background: isPast ? colors.surfaceSecondary : colors.surfaceAccent,
        border: `1px solid ${colors.border}`,
        borderRadius: spacing.md,
        padding: spacing.lg,
        borderLeft: `3px solid ${isPast ? colors.textMuted : typeColor}`,
        transition: 'border-color 0.15s, cursor 0.15s, box-shadow 0.15s',
        opacity: isPast ? 0.7 : 1,
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: 'none',
        fontFamily: typography.fontFamily.body.join(', '),
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        {/* Left content */}
        <div style={{ flex: 1 }}>
          {/* Title with badges */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.md,
              marginBottom: spacing.xs,
            }}
          >
            <span
              style={{
                fontSize: '13px',
                fontWeight: typography.fontWeight.extraBold,
                color: isPast ? colors.textMuted : colors.textPrimary,
                fontFamily: typography.fontFamily.body.join(', '),
              }}
            >
              {title}
            </span>
            {isPast && <Tag bgColor={colors.textMuted} textColor={colors.textMuted}>Completed</Tag>}
            {isFull && !isPast && <Tag bgColor={colors.danger} textColor={colors.danger}>Full</Tag>}
          </div>

          {/* Description */}
          {description && (
            <p
              style={{
                fontSize: '11px',
                color: isPast ? colors.textMuted : colors.textMuted,
                marginBottom: spacing.lg,
                lineHeight: typography.lineHeight.normal,
                fontFamily: typography.fontFamily.body.join(', '),
              }}
            >
              {description}
            </p>
          )}

          {/* DateTime and location */}
          <div
            style={{
              display: 'flex',
              gap: spacing.lg,
              fontSize: '10px',
              color: isPast ? colors.textMuted : colors.textMuted,
              marginBottom: spacing.lg,
              flexWrap: 'wrap',
              fontFamily: typography.fontFamily.body.join(', '),
            }}
          >
            <span>
              🕐 {formatDateTime(startTime)} – {formatDateTime(endTime).split(' ').pop()}
            </span>
            {court && <span>📍 {court}</span>}
          </div>

          {/* Tags: sessionType, status, price */}
          <div
            style={{
              display: 'flex',
              gap: spacing.sm,
              flexWrap: 'wrap',
              alignItems: 'center',
              fontFamily: typography.fontFamily.body.join(', '),
            }}
          >
            <Tag bgColor={isPast ? colors.textMuted : typeColor} textColor={isPast ? colors.textMuted : typeColor}>
              {sessionType}
            </Tag>
            <Tag
              bgColor={status === 'scheduled' ? (isPast ? colors.textMuted : colors.primary) : colors.textMuted}
              textColor={status === 'scheduled' ? (isPast ? colors.textMuted : colors.primary) : colors.textMuted}
            >
              {status}
            </Tag>
            {price && (
              <Tag bgColor={colors.warning} textColor={colors.warning}>
                ${price}/player
              </Tag>
            )}
          </div>
        </div>

        {/* Right: Booking count and progress */}
        <div
          style={{
            textAlign: 'right',
            flexShrink: 0,
            marginLeft: spacing.lg,
            fontFamily: typography.fontFamily.body.join(', '),
          }}
        >
          {/* Count */}
          <div
            style={{
              fontSize: '18px',
              fontWeight: typography.fontWeight.extraBold,
              color: isPast ? colors.textMuted : colors.primaryHover,
            }}
          >
            {bookings}
            <span style={{ fontSize: '11px', color: colors.textMuted }}>
              /{maxParticipants}
            </span>
          </div>

          {/* Label */}
          <div
            style={{
              fontSize: typography.fontSize.caption,
              color: colors.textMuted,
              marginBottom: spacing.xs,
              fontFamily: typography.fontFamily.body.join(', '),
            }}
          >
            players
          </div>

          {/* Progress bar */}
          <div
            style={{
              width: 60,
              height: 4,
              background: colors.background,
              borderRadius: spacing.xs,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${fillPct}%`,
                background: isFull ? colors.danger : isPast ? colors.textMuted : colors.primary,
                borderRadius: spacing.xs,
              }}
            />
          </div>

          {/* Action buttons */}
          {actions && (
            <div
              style={{
                display: 'flex',
                gap: spacing.sm,
                marginTop: spacing.lg,
                justifyContent: 'flex-end',
              }}
            >
              {actions}
            </div>
          )}
          {onEdit && onDelete && (
            <div
              style={{
                display: 'flex',
                gap: spacing.sm,
                marginTop: spacing.lg,
              }}
            >
              <button
                onClick={onEdit}
                style={{
                  padding: `${spacing.xs} ${spacing.sm}`,
                  fontSize: typography.fontSize.caption,
                  borderRadius: spacing.xs,
                  border: 'none',
                  background: colors.info,
                  color: colors.background,
                  cursor: 'pointer',
                  fontWeight: typography.fontWeight.extraBold,
                  fontFamily: typography.fontFamily.body.join(', '),
                }}
              >
                Edit
              </button>
              <button
                onClick={onDelete}
                style={{
                  padding: `${spacing.xs} ${spacing.sm}`,
                  fontSize: typography.fontSize.caption,
                  borderRadius: spacing.xs,
                  border: 'none',
                  background: colors.danger,
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: typography.fontWeight.extraBold,
                  fontFamily: typography.fontFamily.body.join(', '),
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionCard;
