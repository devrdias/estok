import { Redirect, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/model';
import { useTheme } from '@/shared/config';

/**
 * App layout: auth guard + bottom tabs (Início, Contagens, Configurações).
 * Theme-aware (light/dark).
 */
export default function AppLayout() {
  const theme = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  if (user == null) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.white,
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.backgroundCard,
          paddingBottom: insets.bottom,
          height: 56 + insets.bottom,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home.title'),
          tabBarLabel: t('home.tabLabel'),
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="contagens"
        options={{
          title: t('counts.title'),
          tabBarLabel: t('counts.title'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="configuracoes"
        options={{
          title: t('settings.title'),
          tabBarLabel: t('settings.title'),
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
