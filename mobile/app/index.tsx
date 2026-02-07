import { Redirect } from 'expo-router';
import { useAuth } from '../features/auth/model';

/**
 * Root index: redirect to login if not authenticated, else to app home.
 */
export default function Index() {
  const { user } = useAuth();
  if (user == null) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(app)" />;
}
