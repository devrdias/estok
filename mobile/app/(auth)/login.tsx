import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../features/auth/model';
import { theme } from '../../shared/config/theme';
import { Button } from '../../shared/ui';

/**
 * Login screen. "Entrar com Google" uses Google OAuth when configured (EXPO_PUBLIC_GOOGLE_*),
 * otherwise uses mock user. Redirect to app home when user is set.
 * Design: design-system (Sistema Estoque) — CTA button, min touch 44px.
 */
export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isLoading, login } = useAuth();

  useEffect(() => {
    if (user != null) router.replace('/(app)' as any);
  }, [user, router]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('auth.loginWithGoogle')}</Text>
      <Button
        onPress={() => login()}
        variant="primary"
        loading={isLoading}
        disabled={isLoading}
        accessibilityLabel={t('auth.loginWithGoogle')}
        fullWidth
      >
        {t('auth.loginWithGoogle')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  title: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
});
