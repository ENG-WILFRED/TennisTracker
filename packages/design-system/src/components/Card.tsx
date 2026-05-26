import type { HTMLAttributes, ReactNode } from 'react';
import { colors } from '../tokens/colors';
import { radii } from '../tokens/radius';
import { shadows } from '../tokens/shadows';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'glow' | 'featured';
}

export const Card = ({ children, variant = 'default', style, ...rest }: CardProps) => {
  const base = {
    background: variant === 'featured'
      ? `linear-gradient(180deg, ${colors.surface} 0%, ${colors.surfaceAccent} 100%)`
      : colors.surface,
    border: `1px solid ${variant === 'featured' ? colors.highlight : colors.border}`,
    borderRadius: radii['2xl'],
    padding: spacing['2xl'],
    boxShadow:
      variant === 'elevated'
        ? shadows.card
        : variant === 'glow'
        ? '0 0 28px rgba(125,193,66,0.12)'
        : 'none',
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.body.join(', '),
  };

  return (
    <div style={{ ...base, ...style }} {...rest}>
      {children}
    </div>
  );
};
