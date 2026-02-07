import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { getTheme, type Theme, type ColorScheme } from './theme';
import {
  getStoredThemePreference,
  setStoredThemePreference,
  type ThemePreferenceValue,
} from './preferences';

interface ThemeContextValue {
  theme: Theme;
  scheme: ColorScheme;
  preference: ThemePreferenceValue;
  setPreference: (preference: ThemePreferenceValue) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Provides theme (light/dark) and optional preference (system/light/dark). Loads and persists preference.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreferenceValue | null>(null);

  useEffect(() => {
    getStoredThemePreference().then(setPreferenceState);
  }, []);

  const setPreference = useCallback((value: ThemePreferenceValue) => {
    setPreferenceState(value);
    setStoredThemePreference(value);
  }, []);

  const resolvedPreference: ThemePreferenceValue = preference ?? 'system';
  const scheme: ColorScheme =
    resolvedPreference === 'light'
      ? 'light'
      : resolvedPreference === 'dark'
        ? 'dark'
        : systemScheme === 'dark'
          ? 'dark'
          : 'light';
  const theme = useMemo(() => getTheme(scheme), [scheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, scheme, preference: resolvedPreference, setPreference }),
    [theme, scheme, resolvedPreference, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx.theme;
}

/** Returns current scheme, user preference, and setter for settings screen. */
export function useThemePreference(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemePreference must be used within ThemeProvider');
  return ctx;
}

/** Returns current color scheme in use (resolved from preference or system). */
export function useColorSchemeTheme(): ColorScheme {
  const ctx = useContext(ThemeContext);
  if (ctx) return ctx.scheme;
  const systemScheme = useColorScheme();
  return systemScheme === 'dark' ? 'dark' : 'light';
}
