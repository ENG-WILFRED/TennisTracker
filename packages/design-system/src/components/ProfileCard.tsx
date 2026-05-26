import type { HTMLAttributes, ReactNode } from 'react';
import { colors } from '../tokens/colors';
import { radii } from '../tokens/radius';
import { shadows } from '../tokens/shadows';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';

export interface ProfileCardProps extends HTMLAttributes<HTMLDivElement> {
  photoUrl?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  memberSince?: string;
  children: ReactNode;
}

export const ProfileCard = ({ photoUrl, firstName, lastName, email, memberSince, children, style, ...rest }: ProfileCardProps) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radii['2xl'],
        padding: spacing['2xl'],
        boxShadow: shadows.card,
        color: colors.textPrimary,
        fontFamily: typography.fontFamily.body.join(', '),
        ...style,
      }}
      {...rest}
    >
      {/* Header with Avatar and Basic Info */}
      <div style={{ display: 'flex', gap: spacing.xl, alignItems: 'flex-start', marginBottom: spacing['2xl'], paddingBottom: spacing['2xl'], borderBottom: `1px solid ${colors.border}` }}>
        {/* Avatar */}
        <div style={{ flexShrink: 0 }}>
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={`${firstName} ${lastName}`}
              style={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                objectFit: 'cover',
                border: `2px solid ${colors.primary}`,
              }}
            />
          ) : (
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryHover})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: typography.fontSize.h1,
                fontWeight: typography.fontWeight.extraBold,
                color: colors.background,
                border: `2px solid ${colors.primary}`,
              }}
            >
              {initials || '?'}
            </div>
          )}
        </div>

        {/* Profile Summary */}
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: typography.fontSize.h2, fontWeight: typography.fontWeight.extraBold, marginBottom: spacing.sm, color: colors.textPrimary }}>
            {firstName} {lastName}
          </h2>
          <p style={{ fontSize: typography.fontSize.body, color: colors.textMuted, marginBottom: spacing.xs }}>
            {email}
          </p>
          {memberSince && (
            <p style={{ fontSize: typography.fontSize.sm, color: colors.textMuted }}>
              Member since {memberSince}
            </p>
          )}
        </div>
      </div>

      {/* Form Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg }}>
        {children}
      </div>
    </div>
  );
};

export default ProfileCard;
