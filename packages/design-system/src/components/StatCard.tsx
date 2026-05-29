import React from 'react';
import { colors } from '../tokens/colors';
import { radii } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';

export interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

export const StatCard = ({ label, value, hint }: StatCardProps) => {
  return (
    <div
      style={{
        background: colors.surface,
        color: colors.textPrimary,
        borderRadius: radii.md,
        padding: `${spacing.md}`,
        border: `1px solid ${colors.border}`,
        minWidth: 120,
      }}
    >
      <div style={{ fontSize: typography.fontSize.label, color: colors.textMuted }}>{label}</div>
      <div style={{ fontSize: typography.fontSize.h2, fontWeight: typography.fontWeight.bold, marginTop: 8 }}>{value}</div>
      {hint ? <div style={{ fontSize: typography.fontSize.caption, color: colors.textMuted, marginTop: 6 }}>{hint}</div> : null}
    </div>
  );
};

export default StatCard;
