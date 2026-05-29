import type { DefaultToastOptions } from 'react-hot-toast';
import { colors } from '../tokens/colors';
import { radii } from '../tokens/radius';
import { shadows } from '../tokens/shadows';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';

export const toastStyle = {
  background: colors.white,
  color: colors.ToastColor,
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
      primary: colors.ToastColor,
      secondary: colors.white,
    },
    style: {
      borderColor: colors.success,
      color: colors.brandDark,
    },
  },
  error: {
    iconTheme: {
      primary: colors.danger,
      secondary: colors.white,
    },
    style: {
      borderColor: colors.danger,
      color: colors.brandDark,
    },
  },
  loading: {
    iconTheme: {
      primary: colors.blue,
      secondary: colors.white,
    },
    style: {
      borderColor: colors.blue,
      color: colors.brandDark,
    },
  },
};
