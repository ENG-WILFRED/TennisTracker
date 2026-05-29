import { colors } from '../tokens/colors';
import { typography } from '../tokens/typography';
import { spacing } from '../tokens/spacing';
import { radii } from '../tokens/radius';
import { shadows } from '../tokens/shadows';

const tailwindPreset = {
  theme: {
    extend: {
      fontFamily: {
        clash: typography.fontFamily.display,
        epilogue: typography.fontFamily.body,
      },
      colors: {
        vico: {
          primary: colors.primary,
          primaryHover: colors.primaryHover,
          brand: colors.brand,
          brandDark: colors.brandDark,
          brandSoft: colors.brandSoft,
          background: colors.background,
          surface: colors.surface,
          surfaceAccent: colors.surfaceAccent,
          surfaceSecondary: colors.surfaceSecondary,
          surfaceTertiary: colors.surfaceTertiary,
          court: colors.court,
          chalk: colors.chalk,
          border: colors.border,
          textPrimary: colors.textPrimary,
          textMuted: colors.textMuted,
          highlight: colors.highlight,
          accent: colors.accent,
          success: colors.success,
          warning: colors.warning,
          danger: colors.danger,
          info: colors.info,
        },
      },
      boxShadow: {
        card: shadows.card,
        modal: shadows.modal,
        dropdown: shadows.dropdown,
      },
      borderRadius: {
        sm: radii.sm,
        md: radii.md,
        lg: radii.lg,
        xl: radii.xl,
        '2xl': radii['2xl'],
        full: radii.full,
      },
      spacing: {
        4: spacing.xs,
        8: spacing.sm,
        12: spacing.md,
        16: spacing.lg,
        24: spacing.xl,
        32: spacing['2xl'],
        40: spacing['3xl'],
        48: spacing['4xl'],
        64: spacing['5xl'],
      },
    },
    colorSpace: 'srgb',
  },
};

export default tailwindPreset;
export { tailwindPreset };
