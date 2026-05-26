import React from 'react';
import { colors } from '../tokens/colors';
import { radii } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';

export interface ResultItem {
  id: string;
  title: string;
  date?: string;
  score?: string;
}

export interface RecentResultsProps {
  items?: ResultItem[];
}

export const RecentResults = ({ items = [] }: RecentResultsProps) => {
  return (
    <div style={{ background: colors.surface, color: colors.textPrimary, borderRadius: radii.md, padding: spacing.md, border: `1px solid ${colors.border}` }}>
      <div style={{ fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.semibold, marginBottom: 8 }}>Recent Results</div>
      {items.length === 0 ? (
        <div style={{ color: colors.textMuted }}>No results yet. Match history will appear here once connected.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((r) => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{r.title}</div>
                <div style={{ color: colors.textMuted, fontSize: typography.fontSize.caption }}>{r.date}</div>
              </div>
              <div style={{ fontWeight: 700 }}>{r.score}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentResults;
