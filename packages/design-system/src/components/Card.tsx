import type { HTMLAttributes, ReactNode } from 'react';
import { colors } from '../tokens/colors';
import { radii } from '../tokens/radius';
import { shadows } from '../tokens/shadows';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'glow' | 'featured' | 'bordered';
}

export const Card = ({ children, variant = 'default', style, ...rest }: CardProps) => {
  const base = {
    background:
      variant === 'featured'
        ? `linear-gradient(180deg, ${colors.surface} 0%, ${colors.surfaceAccent} 100%)`
        : colors.surfaceAccent,
    border:
      variant === 'bordered'
        ? `1px solid ${colors.border}`
        : variant === 'featured'
        ? `1px solid ${colors.highlight}`
        : 'none',
    borderRadius: radii.xl,
    padding: spacing.lg,
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
