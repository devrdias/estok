import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/model';
import { useTheme } from '@/shared/config';
import { Button, Logo } from '@/shared/ui';

/**
 * Home screen. Theme-aware (light/dark).
 */
export default function HomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { logout } = useAuth();

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
        logo: { marginBottom: theme.spacing.lg },
        title: {
          ...theme.typography.title,
          color: theme.colors.text,
          marginBottom: theme.spacing.sm,
        },
        description: {
          ...theme.typography.bodySmall,
          color: theme.colors.textMuted,
          textAlign: 'center',
          marginBottom: theme.spacing.xl,
          paddingHorizontal: theme.spacing.md,
        },
        logoutButton: { marginTop: theme.spacing.md },
        buttons: {
          width: '100%',
          maxWidth: 280,
          gap: theme.touchGap,
        },
      }),
    [theme]
  );

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login' as any);
  };

  return (
    <View style={styles.container}>
      <Logo size={56} showWordmark accessibilityLabel="Balanço" style={styles.logo} />
      <Text style={styles.title}>{t('home.title')}</Text>
      <Text style={styles.description}>{t('home.description')}</Text>
      <Button
        onPress={() => router.push('/(app)/contagens')}
        fullWidth
        accessibilityLabel={t('home.count')}
      >
        {t('home.count')}
      </Button>
      <Button
        onPress={handleLogout}
        variant="outline"
        fullWidth
        style={styles.logoutButton}
        accessibilityLabel={t('common.logout')}
      >
        {t('common.logout')}
      </Button>
    </View>
  );
}
