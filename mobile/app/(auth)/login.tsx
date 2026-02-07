import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/model';
import { useTheme } from '@/shared/config';
import { Button, Logo } from '@/shared/ui';

/**
 * Login screen. Theme-aware (light/dark).
 */
export default function LoginScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isLoading, login } = useAuth();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: theme.spacing.lg,
          backgroundColor: theme.colors.background,
        },
        logo: { marginBottom: theme.spacing.xl },
        title: {
          ...theme.typography.body,
          fontWeight: '600',
          color: theme.colors.text,
          marginBottom: theme.spacing.lg,
          textAlign: 'center',
        },
      }),
    [theme]
  );

  useEffect(() => {
    if (user != null) router.replace('/(app)' as any);
  }, [user, router]);

  return (
    <View style={styles.container}>
      <Logo size={64} showWordmark accessibilityLabel="Balanço" style={styles.logo} />
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
