import { Platform } from 'react-native';

/**
 * Design system tokens from ui-ux-pro-max (Sistema Estoque MASTER).
 * Use these across screens for consistent UI.
 */
export const theme = {
  colors: {
    primary: '#15803D',
    secondary: '#22C55E',
    cta: '#0369A1',
    background: '#F0FDF4',
    backgroundCard: '#FFFFFF',
    text: '#14532D',
    textMuted: '#475569',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    danger: '#DC2626',
    white: '#FFFFFF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  radius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
  },
  typography: {
    title: { fontSize: 22, fontWeight: '700' as const },
    titleSmall: { fontSize: 20, fontWeight: '700' as const },
    section: { fontSize: 14, fontWeight: '600' as const },
    body: { fontSize: 16 },
    bodySmall: { fontSize: 14 },
    caption: { fontSize: 12 },
  },
  /** Minimum touch target (UX: 44x44px on mobile). */
  minTouchSize: 44,
  /** Gap between adjacent touch targets (UX: min 8px). */
  touchGap: 8,
  /** Transition duration (150–300ms per design system). */
  transitionMs: 200,
  shadows: {
    sm: Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
      android: { elevation: 1 },
    }),
    md: Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
    lg: Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15 },
      android: { elevation: 6 },
    }),
  },
} as const;

export type Theme = typeof theme;
