import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/config';

/**
 * Contagens stack: list → nova → [id]. Theme-aware (light/dark).
 */
export default function ContagensLayout() {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: theme.colors.white,
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: t('counts.title') }}
      />
      <Stack.Screen
        name="nova"
        options={{ title: t('newCount.title') }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: t('counts.title') }}
      />
    </Stack>
  );
}
