import React from 'react';
import { colors } from '../tokens/colors';
import { radii } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';

export interface ActivityItem {
  id: string;
  text: string;
  time?: string;
}

export interface ActivityFeedProps {
  items?: ActivityItem[];
}

export const ActivityFeed = ({ items = [] }: ActivityFeedProps) => {
  return (
    <div style={{ background: colors.surface, color: colors.textPrimary, borderRadius: radii.md, padding: spacing.md, border: `1px dashed ${colors.border}` }}>
      <div style={{ fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.semibold, marginBottom: 8 }}>Activity Feed</div>
      {items.length === 0 ? (
        <div style={{ color: colors.textMuted }}>Activity feed will display real updates once backend support is available.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((it) => (
            <li key={it.id} style={{ padding: 8, borderRadius: radii.sm, background: colors.surfaceSecondary }}>
              <div style={{ fontSize: typography.fontSize.body }}>{it.text}</div>
              {it.time ? <div style={{ color: colors.textMuted, fontSize: typography.fontSize.caption }}>{it.time}</div> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ActivityFeed;
