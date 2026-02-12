import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, UserRole } from '@/features/auth/model';
import type { UserRoleValue } from '@/features/auth/model';
import { useTheme } from '@/shared/config';
import { Button, Logo } from '@/shared/ui';

/** Map role value to its i18n key. */
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

/**
 * Login screen. Shows a user picker when in mock mode (no Google OAuth configured),
 * or the standard Google login button otherwise. Theme-aware (light/dark).
 */
export default function LoginScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isLoading, login, mockUsers } = useAuth();
  const isMockMode = mockUsers.length > 0;

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
        userList: {
          width: '100%',
          maxWidth: 320,
          gap: theme.spacing.md,
        },
        userCard: {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 44,
          padding: theme.spacing.md,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.backgroundCard,
          borderWidth: 1,
          borderColor: theme.colors.border,
          gap: theme.spacing.md,
        },
        userCardPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
        iconContainer: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: theme.colors.primary + '18',
          justifyContent: 'center',
          alignItems: 'center',
        },
        userInfo: { flex: 1 },
        userName: {
          ...theme.typography.body,
          fontWeight: '600',
          color: theme.colors.text,
        },
        userRole: {
          ...theme.typography.bodySmall,
          color: theme.colors.textMuted,
        },
      }),
    [theme]
  );

  useEffect(() => {
    if (user != null) router.replace('/(app)' as any);
  }, [user, router]);

  return (
    <View style={styles.container}>
      <Logo size={64} showWordmark accessibilityLabel="e-stok" style={styles.logo} />

      {isMockMode ? (
        <>
          <Text style={styles.title}>{t('auth.selectUser')}</Text>
          <View style={styles.userList}>
            {mockUsers.map((mockUser) => (
              <Pressable
                key={mockUser.id}
                onPress={() => login(mockUser.id)}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.userCard,
                  pressed && styles.userCardPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${mockUser.name} — ${getRoleLabel(mockUser.role, t)}`}
                accessibilityState={{ disabled: isLoading }}
              >
                <View style={styles.iconContainer}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <Ionicons
                      name={getRoleIcon(mockUser.role)}
                      size={22}
                      color={theme.colors.primary}
                    />
                  )}
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{mockUser.name}</Text>
                  <Text style={styles.userRole}>{getRoleLabel(mockUser.role, t)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
              </Pressable>
            ))}
          </View>
        </>
      ) : (
        <>
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
        </>
      )}
    </View>
  );
}
