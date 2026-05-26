import { colors } from '../tokens/colors';
import { typography } from '../tokens/typography';
import { spacing } from '../tokens/spacing';
import { radii } from '../tokens/radius';
import { shadows } from '../tokens/shadows';
import { sizing } from '../tokens/sizing';

export const vicoTheme = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  sizing,
};

export const vicoThemeCssVariables = {
  '--vico-color-primary': colors.primary,
  '--vico-color-primary-hover': colors.primaryHover,
  '--vico-color-brand': colors.brand,
  '--vico-color-brand-dark': colors.brandDark,
  '--vico-color-brand-soft': colors.brandSoft,
  '--vico-color-court': colors.court,
  '--vico-color-chalk': colors.chalk,
  '--vico-color-background': colors.background,
  '--vico-color-surface': colors.surface,
  '--vico-color-surface-accent': colors.surfaceAccent,
  '--vico-color-surface-secondary': colors.surfaceSecondary,
  '--vico-color-border': colors.border,
  '--vico-color-text-primary': colors.textPrimary,
  '--vico-color-text-muted': colors.textMuted,
  '--vico-color-highlight': colors.highlight,
  '--vico-color-accent': colors.accent,
  '--vico-color-success': colors.success,
  '--vico-color-warning': colors.warning,
  '--vico-color-danger': colors.danger,
  '--vico-color-info': colors.info,
  '--vico-color-focus': colors.focus,
  '--vico-font-family-display': typography.fontFamily.display.join(', '),
  '--vico-font-family-body': typography.fontFamily.body.join(', '),
  '--vico-radius-sm': radii.sm,
  '--vico-radius-md': radii.md,
  '--vico-radius-lg': radii.lg,
  '--vico-radius-xl': radii.xl,
  '--vico-radius-2xl': radii['2xl'],
  '--vico-box-shadow-card': shadows.card,
  '--vico-box-shadow-modal': shadows.modal,
  '--vico-box-shadow-dropdown': shadows.dropdown,
  // layout tokens
  '--vico-sidebar-width': sizing.sidebar,
};
