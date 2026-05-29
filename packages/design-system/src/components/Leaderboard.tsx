import React from 'react';
import { colors } from '../tokens/colors';
import { radii } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';

export interface LeaderboardEntry {
  id: string;
  name: string;
  rank: number;
  points?: number;
}

export interface LeaderboardProps {
  title?: string;
  entries?: LeaderboardEntry[];
}

export const Leaderboard = ({ title = 'Leaderboard', entries = [] }: LeaderboardProps) => {
  return (
    <div style={{ background: colors.surface, color: colors.textPrimary, borderRadius: radii.md, padding: spacing.md, border: `1px solid ${colors.border}` }}>
      <div style={{ fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.semibold, marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.length === 0 ? (
          <div style={{ color: colors.textMuted, padding: 12, borderRadius: radii.sm, border: `1px dashed ${colors.border}` }}>No rankings yet</div>
        ) : (
          entries.map((e) => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: radii.full, background: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.inverse }}>{e.rank}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{e.name}</div>
                  <div style={{ fontSize: typography.fontSize.caption, color: colors.textMuted }}>{e.points ?? 0} pts</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
