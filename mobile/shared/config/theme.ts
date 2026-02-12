import { Platform } from 'react-native';

/**
 * Color palette for light mode (e-stok brand — Indigo/Blue/Cyan).
 *
 * Derived from the isometric-cube logo:
 * - Indigo #4338CA (cube left face)  → cta / accents
 * - Blue   #3B82F6 (cube right face) → primary
 * - Cyan   #06B6D4 (gradient end)    → secondary
 */
export const lightColors = {
  primary: '#3B82F6',
  secondary: '#60A5FA',
  cta: '#4338CA',
  background: '#EFF6FF',
  backgroundCard: '#FFFFFF',
  text: '#1E293B',
  textMuted: '#64748B',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  danger: '#DC2626',
  white: '#FFFFFF',
} as const;

/**
 * Color palette for dark mode (readable contrast, same brand accents).
 *
 * Lighter tints of the brand colors for legibility on dark backgrounds.
 */
export const darkColors = {
  primary: '#60A5FA',
  secondary: '#93C5FD',
  cta: '#818CF8',
  background: '#0F172A',
  backgroundCard: '#1E293B',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  border: '#334155',
  borderLight: '#475569',
  danger: '#F87171',
  white: '#FFFFFF',
} as const;

export type ColorScheme = 'light' | 'dark';

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

const radius = { sm: 6, md: 8, lg: 12, xl: 16 } as const;

const typography = {
  title: { fontSize: 22, fontWeight: '700' as const },
  titleSmall: { fontSize: 20, fontWeight: '700' as const },
  section: { fontSize: 14, fontWeight: '600' as const },
  body: { fontSize: 16 },
  bodySmall: { fontSize: 14 },
  caption: { fontSize: 12 },
} as const;

const shadows = {
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
};

export interface Theme {
  colors: typeof lightColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  minTouchSize: number;
  touchGap: number;
  transitionMs: number;
  shadows: typeof shadows;
}

/**
 * Design system tokens. Colors depend on scheme (light/dark).
 */
export function getTheme(scheme: ColorScheme): Theme {
  return {
    colors: scheme === 'dark' ? darkColors : lightColors,
    spacing,
    radius,
    typography,
    minTouchSize: 44,
    touchGap: 8,
    transitionMs: 200,
    shadows,
  };
}

/** Default theme (light) for static use where context is not available. */
export const theme = getTheme('light');
