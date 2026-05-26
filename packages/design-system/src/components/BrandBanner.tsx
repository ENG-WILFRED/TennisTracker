import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { colors } from '../tokens/colors';
import { radii } from '../tokens/radius';
import { shadows } from '../tokens/shadows';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';

interface BrandBannerProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  logo?: string;
  action?: ReactNode;
}

export const BrandBanner = ({
  title = 'Vico Tennis',
  subtitle = 'High-performance tenant-ready UI for clubs and courts',
  logo,
  action,
  style,
  ...rest
}: BrandBannerProps) => {
  const wrapperStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    padding: spacing['2xl'],
    borderRadius: radii['2xl'],
    background: `linear-gradient(135deg, ${colors.brand}, ${colors.surfaceTertiary})`,
    boxShadow: shadows.card,
    color: colors.textPrimary,
    border: `1px solid ${colors.highlight}`,
    ...style,
  };

  const logoStyle: CSSProperties = {
    width: 60,
    height: 60,
    borderRadius: radii.full,
    objectFit: 'cover',
    border: `2px solid ${colors.surfaceAccent}`,
    backgroundColor: colors.surface,
  };

  return (
    <section style={wrapperStyle} {...rest}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
        {logo ? (
          <img src={logo} alt={`${title} logo`} style={logoStyle} />
        ) : (
          <div
            style={{
              ...logoStyle,
              display: 'grid',
              placeItems: 'center',
              fontSize: typography.fontSize.h4,
              fontWeight: typography.fontWeight.extraBold,
              color: colors.brand,
              backgroundColor: colors.surfaceSecondary,
            }}
          >
            V
          </div>
        )}
        <div>
          <h2 style={{ margin: 0, fontSize: typography.fontSize.h3, fontWeight: typography.fontWeight.extraBold, letterSpacing: '0.02em' }}>
            {title}
          </h2>
          <p style={{ margin: `${spacing.xs} 0 0`, color: colors.textMuted, fontSize: typography.fontSize.body, maxWidth: '28rem' }}>
            {subtitle}
          </p>
        </div>
      </div>
      {action ? <div>{action}</div> : null}
    </section>
  );
};
