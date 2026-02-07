import { Platform } from 'react-native';

/** Color palette for light mode (design-system Sistema Estoque). */
export const lightColors = {
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
} as const;

/** Color palette for dark mode (readable contrast, same brand accents). */
export const darkColors = {
  primary: '#22C55E',
  secondary: '#4ADE80',
  cta: '#0EA5E9',
  background: '#0f172a',
  backgroundCard: '#1e293b',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  border: '#334155',
  borderLight: '#475569',
  danger: '#f87171',
  white: '#ffffff',
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
