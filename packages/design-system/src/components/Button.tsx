import type { ButtonHTMLAttributes } from 'react';
import { colors } from '../tokens/colors';
import { radii } from '../tokens/radius';
import { shadows } from '../tokens/shadows';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'brand';
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: {
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: typography.fontSize.label,
  },
  md: {
    padding: `${spacing.sm} ${spacing.lg}`,
    fontSize: typography.fontSize.body,
  },
  lg: {
    padding: `${spacing.md} ${spacing.xl}`,
    fontSize: typography.fontSize.body,
  },
};

const variantStylesMap = {
  primary: {
    background: `linear-gradient(135deg, ${colors.brand}, ${colors.primaryHover})`,
    color: colors.inverse,
    border: '1px solid transparent',
    boxShadow: shadows.card,
  },
  brand: {
    background: `linear-gradient(135deg, ${colors.brandDark}, ${colors.brand})`,
    color: colors.inverse,
    border: '1px solid transparent',
    boxShadow: shadows.card,
  },
  secondary: {
    backgroundColor: colors.surfaceSecondary,
    color: colors.textPrimary,
    border: `1px solid ${colors.border}`,
  },
  danger: {
    backgroundColor: colors.danger,
    color: colors.inverse,
    border: '1px solid transparent',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: colors.textPrimary,
    border: `1px solid ${colors.border}`,
  },
};

export const Button = ({ variant = 'primary', size = 'md', style, children, ...rest }: ButtonProps) => {
  const variantStyles = variantStylesMap[variant];

  return (
    <button
      type="button"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radii.full,
        fontFamily: typography.fontFamily.body.join(', '),
        fontWeight: typography.fontWeight.semibold,
        cursor: 'pointer',
        transition: 'transform 0.15s ease, opacity 0.15s ease',
        ...sizeStyles[size],
        ...variantStyles,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
};
