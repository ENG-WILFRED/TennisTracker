import type { InputHTMLAttributes } from 'react';
import { colors } from '../tokens/colors';
import { radii } from '../tokens/radius';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = ({ label, style, ...rest }: InputProps) => {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, fontFamily: typography.fontFamily.body.join(', ') }}>
      {label ? <span style={{ color: colors.textMuted, fontSize: typography.fontSize.label }}>{label}</span> : null}
      <input
        style={{
          width: '100%',
          minHeight: '44px',
          borderRadius: radii.lg,
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.surfaceSecondary,
          color: colors.textPrimary,
          padding: `${spacing.sm} ${spacing.md}`,
          fontSize: typography.fontSize.body,
          outline: 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          ...style,
        }}
        {...rest}
      />
    </label>
  );
};
