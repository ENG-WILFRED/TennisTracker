import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { colors } from '../tokens/colors';
import { radii } from '../tokens/radius';
import { shadows } from '../tokens/shadows';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';

interface DashboardShellProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const shellStyles: CSSProperties = {
  minHeight: '100vh',
  width: '100%',
  display: 'flex',
  flexDirection: 'row',
  backgroundColor: colors.background,
  backgroundImage: `radial-gradient(circle at top right, ${colors.brandSoft} 0%, transparent 36%), radial-gradient(circle at 15% 20%, ${colors.accent} 0%, transparent 28%)`,
  color: colors.textPrimary,
  fontFamily: typography.fontFamily.body.join(', '),
};

export const DashboardShell = ({ children, style, ...rest }: DashboardShellProps) => (
  <div style={{ ...shellStyles, ...style }} {...rest}>
    {children}
  </div>
);

export const DashboardSidebar = ({ children, style, ...rest }: DashboardShellProps) => (
  <aside
    style={{
      minHeight: '100vh',
      width: 320,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: colors.surfaceSecondary,
      borderRight: `1px solid ${colors.border}`,
      boxShadow: shadows.card,
      padding: spacing['2xl'],
      gap: spacing['2xl'],
      backgroundImage: `linear-gradient(180deg, rgba(125,193,66,0.08), transparent 60%)`,
      ...style,
    }}
    {...rest}
  >
    {children}
  </aside>
);

export const DashboardMain = ({ children, style, ...rest }: DashboardShellProps) => (
  <main
    style={{
      flex: 1,
      minHeight: '100vh',
      overflowY: 'auto',
      backgroundColor: colors.background,
      padding: spacing['2xl'],
      ...style,
    }}
    {...rest}
  >
    {children}
  </main>
);

export const DashboardPanel = ({ children, style, ...rest }: DashboardShellProps & { variant?: 'default' | 'elevated' }) => (
  <div
    style={{
      backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: radii['2xl'],
      padding: spacing['2xl'],
      boxShadow: shadows.card,
      ...style,
    }}
    {...rest}
  >
    {children}
  </div>
);

export const DashboardNavButton = ({ children, active, style, ...rest }: HTMLAttributes<HTMLButtonElement> & { children: ReactNode; active?: boolean }) => (
  <button
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
      padding: `${spacing.sm} ${spacing.md}`,
      backgroundColor: active ? colors.surfaceTertiary : 'transparent',
      border: 'none',
      borderLeft: `4px solid ${active ? colors.primary : 'transparent'}`,
      color: active ? colors.textPrimary : colors.textMuted,
      textAlign: 'left',
      cursor: 'pointer',
      fontFamily: typography.fontFamily.body.join(', '),
      fontSize: typography.fontSize.body,
      ...style,
    }}
    type="button"
    {...rest}
  >
    {children}
  </button>
);

export const DashboardSectionHeader = ({ title, action, style }: { title: string; action?: ReactNode; style?: CSSProperties }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, ...style }}>
    <div style={{ fontSize: typography.fontSize.label, fontWeight: typography.fontWeight.extraBold, letterSpacing: '0.18em', textTransform: 'uppercase', color: colors.primary }}>
      {title}
    </div>
    {action ? <div>{action}</div> : null}
  </div>
);
