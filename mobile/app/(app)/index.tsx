import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../features/auth/model';
import { theme } from '../../shared/config/theme';
import { Button } from '../../shared/ui';

/**
 * Tela Inicial: Contagem, Configurações, Sair.
 * Design: design-system — primary CTA, outline secondary, spacing 8px between targets.
 */
export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { logout } = useAuth();

  const handleContagem = () => router.push('/(app)/contagens');
  const handleConfiguracoes = () => router.push('/(app)/configuracoes');
  const handleSair = () => {
    logout();
    router.replace('/(auth)/login' as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('home.title')}</Text>
      <Text style={styles.description}>{t('home.description')}</Text>

      <View style={styles.buttons}>
        <Button onPress={handleContagem} fullWidth accessibilityLabel={t('home.count')}>
          {t('home.count')}
        </Button>
        <Button onPress={handleConfiguracoes} fullWidth accessibilityLabel={t('home.settings')}>
          {t('home.settings')}
        </Button>
        <Button onPress={handleSair} variant="outline" fullWidth accessibilityLabel={t('common.logout')}>
          {t('common.logout')}
        </Button>
      </View>
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
  buttons: {
    width: '100%',
    maxWidth: 280,
    gap: theme.touchGap,
  },
});
