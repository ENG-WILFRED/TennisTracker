import type { DefaultToastOptions } from 'react-hot-toast';
import { colors } from '../tokens/colors';
import { radii } from '../tokens/radius';
import { shadows } from '../tokens/shadows';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';

export const toastStyle = {
  background: colors.surface,
  color: colors.textPrimary,
  border: `1px solid ${colors.border}`,
  boxShadow: shadows.card,
  borderRadius: radii.xl,
  fontFamily: typography.fontFamily.body.join(', '),
  padding: `${spacing.md} ${spacing.lg}`,
  minWidth: '320px',
};

export const toastOptions: DefaultToastOptions = {
  duration: 3000,
  position: 'top-right',
  style: toastStyle,
  success: {
    iconTheme: {
      primary: colors.primary,
      secondary: colors.surface,
    },
    style: {
      borderColor: colors.primary,
      color: colors.textPrimary,
    },
  },
  error: {
    iconTheme: {
      primary: colors.danger,
      secondary: colors.surface,
    },
    style: {
      borderColor: colors.danger,
      color: colors.textPrimary,
    },
  },
  loading: {
    iconTheme: {
      primary: colors.primaryHover,
      secondary: colors.surface,
    },
    style: {
      borderColor: colors.primaryHover,
      color: colors.textPrimary,
    },
  },
};
