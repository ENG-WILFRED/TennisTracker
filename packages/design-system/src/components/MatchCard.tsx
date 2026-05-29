import React from 'react';
import { colors } from '../tokens/colors';
import { radii } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';

export interface MatchCardProps {
  title?: string;
  description?: string;
}

export const MatchCard = ({ title = 'Next Match', description }: MatchCardProps) => {
  return (
    <div style={{ background: colors.surface, color: colors.textPrimary, borderRadius: radii.lg, padding: spacing.lg, border: `1px solid ${colors.border}`, minHeight: 160 }}>
      <div style={{ fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.semibold, marginBottom: 12 }}>{title}</div>
      <div style={{ color: colors.textMuted }}>{description ?? 'No upcoming match'}</div>
    </div>
  );
};

export default MatchCard;
