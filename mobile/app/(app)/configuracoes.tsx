import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { useAuth } from '../../features/auth/model';
import i18n from '../../shared/config/i18n';
import { theme } from '../../shared/config/theme';
import { Button, Card } from '../../shared/ui';

/**
 * Configurações: idioma (PT/EN), conta, voltar e sair.
 * Design: design-system — Card for account, min touch 44px for lang toggles.
 */
export default function ConfiguracoesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, logout } = useAuth();
  const currentLng = i18n.language?.startsWith('en') ? 'en' : 'pt';

  const setLanguage = (lng: 'pt' | 'en') => {
    i18n.changeLanguage(lng);
  };

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login' as any);
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('settings.title')}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        <View style={styles.row}>
          <Pressable
            style={[styles.langButton, currentLng === 'pt' && styles.langButtonActive]}
            onPress={() => setLanguage('pt')}
            accessibilityRole="button"
            accessibilityLabel="Português"
            accessibilityState={{ selected: currentLng === 'pt' }}
          >
            <Text style={[styles.langText, currentLng === 'pt' && styles.langTextActive]}>PT</Text>
          </Pressable>
          <Pressable
            style={[styles.langButton, currentLng === 'en' && styles.langButtonActive]}
            onPress={() => setLanguage('en')}
            accessibilityRole="button"
            accessibilityLabel="English"
            accessibilityState={{ selected: currentLng === 'en' }}
          >
            <Text style={[styles.langText, currentLng === 'en' && styles.langTextActive]}>EN</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
        {user && (
          <Card>
            <Text style={styles.accountName}>{user.name ?? user.email}</Text>
            <Text style={styles.accountEmail}>{user.email}</Text>
          </Card>
        )}
      </View>

      <View style={styles.buttons}>
        <Button onPress={() => router.back()} variant="primary" fullWidth accessibilityLabel={t('common.back')}>
          {t('common.back')}
        </Button>
        <Button onPress={handleLogout} variant="outline" fullWidth accessibilityLabel={t('common.logout')}>
          {t('common.logout')}
        </Button>
      </View>
    </ScrollView>
  );
}

const minTouch = theme.minTouchSize;

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: theme.spacing.lg, paddingBottom: theme.spacing['2xl'], backgroundColor: theme.colors.background },
  title: { ...theme.typography.title, color: theme.colors.text, marginBottom: theme.spacing.lg },
  section: { marginBottom: theme.spacing.lg },
  sectionTitle: { ...theme.typography.section, color: theme.colors.textMuted, marginBottom: theme.spacing.sm },
  row: { flexDirection: 'row', gap: theme.spacing.md },
  langButton: {
    minHeight: minTouch,
    minWidth: minTouch,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  langButtonActive: { backgroundColor: theme.colors.cta, borderColor: theme.colors.cta },
  langText: { ...theme.typography.body, color: theme.colors.text },
  langTextActive: { color: theme.colors.white, fontWeight: '600' },
  accountName: { ...theme.typography.body, fontWeight: '600', color: theme.colors.text, marginBottom: theme.spacing.xs },
  accountEmail: { ...theme.typography.bodySmall, color: theme.colors.textMuted },
  buttons: { gap: theme.touchGap },
});
