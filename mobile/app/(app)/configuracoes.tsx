import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuth, usePermissions, UserRole } from '@/features/auth/model';
import type { UserRoleValue } from '@/features/auth/model';
import { setStoredLanguage } from '@/shared/config/i18n';
import i18n from '@/shared/config/i18n';
import {
  getStoredProductSortOrder,
  setStoredProductSortOrder,
  ProductSortOrder,
  type ProductSortOrderValue,
  getStoredBlindCount,
  setStoredBlindCount,
  useTheme,
  useThemePreference,
} from '@/shared/config';
import { Button, Card, Logo, SegmentedControl } from '@/shared/ui';

/** Map role value to its translated label. */
function getRoleLabel(role: UserRoleValue, t: (key: string) => string): string {
  switch (role) {
    case UserRole.ADMIN:
      return t('auth.roleAdmin');
    case UserRole.MANAGER:
      return t('auth.roleManager');
    case UserRole.EMPLOYEE:
      return t('auth.roleEmployee');
    default:
      return role;
  }
}

/** Map role to an icon name. */
function getRoleIcon(role: UserRoleValue): keyof typeof Ionicons.glyphMap {
  switch (role) {
    case UserRole.ADMIN:
      return 'shield-checkmark';
    case UserRole.MANAGER:
      return 'briefcase';
    case UserRole.EMPLOYEE:
    default:
      return 'person';
  }
}

/** Extract initials from a user name (up to 2 characters). */
function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

/**
 * Settings screen with profile header, preferences, and account management.
 * Theme-aware (light/dark).
 */
export default function ConfiguracoesScreen() {
  const theme = useTheme();
  const { preference: themePreference, setPreference: setThemePreference } = useThemePreference();
  const { t } = useTranslation();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { canChangeBlindCount } = usePermissions();
  const currentLng = i18n.language?.startsWith('en') ? 'en' : 'pt';
  const [productSort, setProductSort] = useState<ProductSortOrderValue>('nome');
  const [blindCount, setBlindCount] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: { flex: 1, backgroundColor: theme.colors.background },
        container: {
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing['3xl'],
        },
        /* ── Profile ── */
        profileCard: {
          alignItems: 'center',
          paddingVertical: theme.spacing.xl,
          paddingHorizontal: theme.spacing.lg,
          marginBottom: theme.spacing.lg,
        },
        avatarContainer: {
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: theme.colors.primary + '20',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.spacing.md,
        },
        avatarImage: {
          width: 80,
          height: 80,
          borderRadius: 40,
        },
        avatarInitials: {
          fontSize: 28,
          fontWeight: '700',
          color: theme.colors.primary,
        },
        profileName: {
          ...theme.typography.title,
          color: theme.colors.text,
          textAlign: 'center',
          marginBottom: theme.spacing.xs,
        },
        profileEmail: {
          ...theme.typography.bodySmall,
          color: theme.colors.textMuted,
          textAlign: 'center',
          marginBottom: theme.spacing.sm,
        },
        roleBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 5,
          borderRadius: 20,
          backgroundColor: theme.colors.primary + '18',
        },
        roleBadgeText: {
          ...theme.typography.caption,
          fontWeight: '600',
          color: theme.colors.primary,
        },
        /* ── Sections ── */
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
          marginBottom: theme.spacing.md,
          marginTop: theme.spacing.md,
        },
        sectionTitle: {
          ...theme.typography.section,
          color: theme.colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        settingsCard: {
          gap: 0,
          padding: 0,
          overflow: 'hidden',
        },
        /* ── Setting rows ── */
        settingRow: {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
        },
        settingRowBorder: {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border,
        },
        settingLabel: {
          ...theme.typography.body,
          color: theme.colors.text,
          fontWeight: '500',
          marginBottom: theme.spacing.sm,
        },
        settingDescription: {
          ...theme.typography.caption,
          color: theme.colors.textMuted,
          marginBottom: theme.spacing.sm,
        },
        disabledOverlay: { opacity: 0.45 },
        noPermissionHint: {
          ...theme.typography.caption,
          color: theme.colors.textMuted,
          fontStyle: 'italic',
          marginTop: theme.spacing.xs,
        },
        /* ── Footer ── */
        footer: {
          marginTop: theme.spacing.xl,
          alignItems: 'center',
          gap: theme.spacing.md,
        },
        logoutButton: {
          width: '100%',
          maxWidth: 280,
        },
        versionText: {
          ...theme.typography.caption,
          color: theme.colors.textMuted,
        },
      }),
    [theme],
  );

  useEffect(() => {
    getStoredProductSortOrder().then(setProductSort);
    getStoredBlindCount().then(setBlindCount);
  }, []);

  const setLanguage = (lng: 'pt' | 'en') => setStoredLanguage(lng);
  const setProductSortOrder = (order: ProductSortOrderValue) => {
    setStoredProductSortOrder(order);
    setProductSort(order);
  };
  const toggleBlindCount = (value: string) => {
    const enabled = value === 'yes';
    setStoredBlindCount(enabled);
    setBlindCount(enabled);
  };
  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login' as never);
  };

  const languageOptions = [
    { value: 'pt', label: 'Português' },
    { value: 'en', label: 'English' },
  ] as const;

  const themeOptions = [
    { value: 'system' as const, label: t('settings.themeSystem') },
    { value: 'light' as const, label: t('settings.themeLight') },
    { value: 'dark' as const, label: t('settings.themeDark') },
  ];

  const sortOptions = [
    { value: ProductSortOrder.NOME, label: t('settings.sortByName') },
    { value: ProductSortOrder.CODIGO, label: t('settings.sortByCode') },
    { value: ProductSortOrder.VALOR, label: t('settings.sortByValue') },
  ];

  const blindCountOptions = [
    { value: 'yes', label: t('settings.yes') },
    { value: 'no', label: t('settings.no') },
  ];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* ── Profile Card ── */}
      {user && (
        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {user.photoUrl ? (
              <Image
                source={{ uri: user.photoUrl }}
                style={styles.avatarImage}
                accessibilityLabel={user.name ?? user.email}
              />
            ) : (
              <Text style={styles.avatarInitials}>
                {getInitials(user.name, user.email)}
              </Text>
            )}
          </View>
          <Text style={styles.profileName}>{user.name ?? user.email}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name={getRoleIcon(user.role)} size={14} color={theme.colors.primary} />
            <Text style={styles.roleBadgeText}>{getRoleLabel(user.role, t)}</Text>
          </View>
        </Card>
      )}

      {/* ── Preferences Section ── */}
      <View style={styles.sectionHeader}>
        <Ionicons name="options-outline" size={16} color={theme.colors.textMuted} />
        <Text style={styles.sectionTitle}>{t('settings.preferences')}</Text>
      </View>
      <Card style={styles.settingsCard}>
        {/* Language */}
        <View style={[styles.settingRow, styles.settingRowBorder]}>
          <Text style={styles.settingLabel}>{t('settings.language')}</Text>
          <SegmentedControl
            options={languageOptions}
            selectedValue={currentLng}
            onSelect={setLanguage}
            accessibilityLabel={t('settings.language')}
          />
        </View>

        {/* Theme */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{t('settings.theme')}</Text>
          <SegmentedControl
            options={themeOptions}
            selectedValue={themePreference}
            onSelect={setThemePreference}
            accessibilityLabel={t('settings.theme')}
          />
        </View>
      </Card>

      {/* ── Counting Section ── */}
      <View style={styles.sectionHeader}>
        <Ionicons name="clipboard-outline" size={16} color={theme.colors.textMuted} />
        <Text style={styles.sectionTitle}>{t('settings.counting')}</Text>
      </View>
      <Card style={styles.settingsCard}>
        {/* Product sort order */}
        <View style={[styles.settingRow, styles.settingRowBorder]}>
          <Text style={styles.settingLabel}>{t('settings.countProductSort')}</Text>
          <SegmentedControl
            options={sortOptions}
            selectedValue={productSort}
            onSelect={setProductSortOrder}
            accessibilityLabel={t('settings.countProductSort')}
          />
        </View>

        {/* Blind count */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{t('settings.blindCount')}</Text>
          <Text style={styles.settingDescription}>
            {t('settings.blindCountDescription')}
          </Text>
          <View style={!canChangeBlindCount ? styles.disabledOverlay : undefined}>
            <SegmentedControl
              options={blindCountOptions}
              selectedValue={blindCount ? 'yes' : 'no'}
              onSelect={toggleBlindCount}
              disabled={!canChangeBlindCount}
              accessibilityLabel={t('settings.blindCount')}
            />
          </View>
          {!canChangeBlindCount && (
            <Text style={styles.noPermissionHint}>{t('settings.noPermission')}</Text>
          )}
        </View>
      </Card>

      {/* ── Footer: Logout + Version ── */}
      <View style={styles.footer}>
        <Logo size={32} showWordmark accessibilityLabel="e-stok" />
        <Button
          onPress={handleLogout}
          variant="outline"
          fullWidth
          accessibilityLabel={t('common.logout')}
          style={styles.logoutButton}
        >
          {t('common.logout')}
        </Button>
        <Text style={styles.versionText}>
          {t('settings.version', { version: APP_VERSION })}
        </Text>
      </View>
    </ScrollView>
  );
}
