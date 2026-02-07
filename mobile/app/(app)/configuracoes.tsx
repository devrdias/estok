import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/model';
import { setStoredLanguage } from '@/shared/config/i18n';
import i18n from '@/shared/config/i18n';
import {
  getStoredProductSortOrder,
  setStoredProductSortOrder,
  ProductSortOrder,
  type ProductSortOrderValue,
  useTheme,
  useThemePreference,
} from '@/shared/config';
import { Button, Card, Logo } from '@/shared/ui';

/**
 * Configurações: idioma, ordem da lista, conta, sair. Theme-aware (light/dark).
 */
export default function ConfiguracoesScreen() {
  const theme = useTheme();
  const { preference: themePreference, setPreference: setThemePreference } = useThemePreference();
  const { t } = useTranslation();
  const router = useRouter();
  const { user, logout } = useAuth();
  const currentLng = i18n.language?.startsWith('en') ? 'en' : 'pt';
  const [productSort, setProductSort] = useState<ProductSortOrderValue>('nome');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: { flex: 1 },
        container: {
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing['2xl'],
          backgroundColor: theme.colors.background,
        },
        logo: { marginBottom: theme.spacing.lg },
        title: { ...theme.typography.title, color: theme.colors.text, marginBottom: theme.spacing.lg },
        section: { marginBottom: theme.spacing.lg },
        sectionTitle: {
          ...theme.typography.section,
          color: theme.colors.textMuted,
          marginBottom: theme.spacing.sm,
        },
        row: { flexDirection: 'row', gap: theme.spacing.md },
        langButton: {
          minHeight: theme.minTouchSize,
          minWidth: theme.minTouchSize,
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
        accountName: {
          ...theme.typography.body,
          fontWeight: '600',
          color: theme.colors.text,
          marginBottom: theme.spacing.xs,
        },
        accountEmail: { ...theme.typography.bodySmall, color: theme.colors.textMuted },
        buttons: { gap: theme.touchGap },
      }),
    [theme]
  );

  useEffect(() => {
    getStoredProductSortOrder().then(setProductSort);
  }, []);

  const setLanguage = (lng: 'pt' | 'en') => setStoredLanguage(lng);
  const setProductSortOrder = (order: ProductSortOrderValue) => {
    setStoredProductSortOrder(order);
    setProductSort(order);
  };
  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login' as any);
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Logo size={40} showWordmark accessibilityLabel="Balanço" style={styles.logo} />
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
        <Text style={styles.sectionTitle}>{t('settings.theme')}</Text>
        <View style={styles.row}>
          {(['system', 'light', 'dark'] as const).map((value) => (
            <Pressable
              key={value}
              style={[styles.langButton, themePreference === value && styles.langButtonActive]}
              onPress={() => setThemePreference(value)}
              accessibilityRole="button"
              accessibilityLabel={
                value === 'system'
                  ? t('settings.themeSystem')
                  : value === 'light'
                    ? t('settings.themeLight')
                    : t('settings.themeDark')
              }
              accessibilityState={{ selected: themePreference === value }}
            >
              <Text
                style={[
                  styles.langText,
                  themePreference === value && styles.langTextActive,
                ]}
              >
                {value === 'system'
                  ? t('settings.themeSystem')
                  : value === 'light'
                    ? t('settings.themeLight')
                    : t('settings.themeDark')}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.countProductSort')}</Text>
        <View style={styles.row}>
          <Pressable
            style={[styles.langButton, productSort === ProductSortOrder.NOME && styles.langButtonActive]}
            onPress={() => setProductSortOrder(ProductSortOrder.NOME)}
            accessibilityRole="button"
            accessibilityLabel={t('settings.sortByName')}
            accessibilityState={{ selected: productSort === ProductSortOrder.NOME }}
          >
            <Text style={[styles.langText, productSort === ProductSortOrder.NOME && styles.langTextActive]}>
              {t('settings.sortByName')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.langButton, productSort === ProductSortOrder.CODIGO && styles.langButtonActive]}
            onPress={() => setProductSortOrder(ProductSortOrder.CODIGO)}
            accessibilityRole="button"
            accessibilityLabel={t('settings.sortByCode')}
            accessibilityState={{ selected: productSort === ProductSortOrder.CODIGO }}
          >
            <Text style={[styles.langText, productSort === ProductSortOrder.CODIGO && styles.langTextActive]}>
              {t('settings.sortByCode')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.langButton, productSort === ProductSortOrder.VALOR && styles.langButtonActive]}
            onPress={() => setProductSortOrder(ProductSortOrder.VALOR)}
            accessibilityRole="button"
            accessibilityLabel={t('settings.sortByValue')}
            accessibilityState={{ selected: productSort === ProductSortOrder.VALOR }}
          >
            <Text style={[styles.langText, productSort === ProductSortOrder.VALOR && styles.langTextActive]}>
              {t('settings.sortByValue')}
            </Text>
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
        <Button onPress={handleLogout} variant="outline" fullWidth accessibilityLabel={t('common.logout')}>
          {t('common.logout')}
        </Button>
      </View>
    </ScrollView>
  );
}
