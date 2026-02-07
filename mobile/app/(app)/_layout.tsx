import { Redirect } from 'expo-router';
import { Stack } from 'expo-router';
import { useAuth } from '../../features/auth/model';

/**
 * App layout: guard — redirect to login if not authenticated.
 */
export default function AppLayout() {
  const { user } = useAuth();
  if (user == null) return <Redirect href="/(auth)/login" />;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="contagens/index" />
      <Stack.Screen name="contagens/nova" />
      <Stack.Screen name="contagens/[id]" />
      <Stack.Screen name="configuracoes" />
    </Stack>
  );
}
