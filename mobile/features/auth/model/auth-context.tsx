import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { useAuthRequest } from 'expo-auth-session/providers/google';
import { fetchUserInfoAsync } from 'expo-auth-session';
import { discovery } from 'expo-auth-session/providers/google';
import type { AuthUser } from './types';

WebBrowser.maybeCompleteAuthSession();

const AUTH_STORAGE_KEY = 'auth_user';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const MOCK_USER: AuthUser = {
  id: 'mock-user-1',
  email: 'usuario@exemplo.com',
  name: 'Usuário Mock',
  photoUrl: null,
};

async function mockLogin(): Promise<AuthUser> {
  await new Promise((r) => setTimeout(r, 400));
  return MOCK_USER;
}

function mapGoogleUserInfo(info: Record<string, unknown>): AuthUser {
  return {
    id: String(info.sub ?? info.id ?? ''),
    email: String(info.email ?? ''),
    name: (info.name as string) ?? null,
    photoUrl: (info.picture as string) ?? null,
  };
}

async function restoreStoredUser(): Promise<AuthUser | null> {
  try {
    const raw = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (parsed?.id && parsed?.email) return parsed;
  } catch {
    // ignore
  }
  return null;
}

async function persistUser(user: AuthUser | null): Promise<void> {
  try {
    if (user) {
      await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';

/**
 * Auth provider when Google OAuth is configured. Uses expo-auth-session Google provider
 * and persists session with expo-secure-store.
 */
function GoogleAuthProviderContent({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestored, setIsRestored] = useState(false);

  const [, fullResult, promptAsync] = useAuthRequest(
    {
      clientId: googleWebClientId,
      webClientId: googleWebClientId || undefined,
      iosClientId: googleIosClientId || googleWebClientId || undefined,
      androidClientId: googleAndroidClientId || googleWebClientId || undefined,
      shouldAutoExchangeCode: true,
    },
    {}
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await restoreStoredUser();
      if (!cancelled) {
        setUser(stored);
        setIsRestored(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isRestored || !fullResult || fullResult.type !== 'success') return;
    const auth = (fullResult as { authentication?: { accessToken: string } }).authentication;
    if (!auth?.accessToken) return;

    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const info = await fetchUserInfoAsync(
          { accessToken: auth.accessToken },
          discovery
        );
        if (!cancelled) {
          const authUser = mapGoogleUserInfo(info as Record<string, unknown>);
          setUser(authUser);
          await persistUser(authUser);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isRestored, fullResult]);

  const login = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await promptAsync();
      if (result.type !== 'success' || !(result as { authentication?: unknown }).authentication) {
        setIsLoading(false);
      }
    } catch {
      setIsLoading(false);
    }
  }, [promptAsync]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      setUser(null);
      await persistUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading: !isRestored || isLoading, login, logout }),
    [user, isLoading, isRestored, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Mock auth provider when Google OAuth is not configured. No persistence.
 */
function MockAuthProviderContent({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async () => {
    setIsLoading(true);
    try {
      const u = await mockLogin();
      setUser(u);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 200));
    setUser(null);
    setIsLoading(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Root auth provider. Uses Google OAuth when EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is set,
 * otherwise falls back to mock login for development.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const useGoogle = Boolean(googleWebClientId);

  if (useGoogle) {
    return <GoogleAuthProviderContent>{children}</GoogleAuthProviderContent>;
  }
  return <MockAuthProviderContent>{children}</MockAuthProviderContent>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
