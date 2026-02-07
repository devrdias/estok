import { Stack } from 'expo-router';
import { initI18n } from '../shared/config/i18n';
import { AuthProvider } from '../features/auth/model';
import { ErpProviderContextProvider } from '../shared/api';

initI18n();

/**
 * Root layout. Auth + ERP provider (mock until services integrated).
 */
export default function RootLayout() {
  return (
    <AuthProvider>
      <ErpProviderContextProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ErpProviderContextProvider>
    </AuthProvider>
  );
}
