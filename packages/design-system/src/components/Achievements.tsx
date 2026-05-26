import React from 'react';
import { colors } from '../tokens/colors';
import { radii } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';

export interface AchievementsProps {
  items?: string[];
}

export const Achievements = ({ items = [] }: AchievementsProps) => {
  return (
    <div style={{ background: colors.surface, color: colors.textPrimary, borderRadius: radii.md, padding: spacing.md, border: `1px dashed ${colors.border}` }}>
      <div style={{ fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.semibold, marginBottom: 8 }}>Achievements</div>
      {items.length === 0 ? (
        <div style={{ color: colors.textMuted }}>Achievements will display here once backend data is connected.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((it, idx) => (
            <li key={idx} style={{ padding: 8, borderRadius: radii.sm, background: colors.surfaceSecondary, marginBottom: 8 }}>{it}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Achievements;
