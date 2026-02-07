import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initI18n, getStoredLanguage } from '@/shared/config/i18n';
import i18n from '@/shared/config/i18n';
import { ThemeProvider, useColorSchemeTheme } from '@/shared/config';
import { AuthProvider } from '@/features/auth/model';
import { ErpProviderContextProvider } from '@/shared/api';

initI18n();

/**
 * Applies persisted language preference on mount.
 */
function LanguageRestorer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    getStoredLanguage().then((lng) => {
      if (lng) i18n.changeLanguage(lng);
    });
  }, []);
  return <>{children}</>;
}

/**
 * Status bar style from current theme (light content on dark, dark content on light).
 */
function ThemedStatusBar() {
  const scheme = useColorSchemeTheme();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}

/**
 * Root layout. Theme (light/dark) + Auth + ERP provider.
 */
export default function RootLayout() {
  return (
    <ThemeProvider>
      <ThemedStatusBar />
      <LanguageRestorer>
        <AuthProvider>
          <ErpProviderContextProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </ErpProviderContextProvider>
        </AuthProvider>
      </LanguageRestorer>
    </ThemeProvider>
  );
}
