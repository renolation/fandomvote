import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { clearSession, getSession, setSession, subscribe } from '@/lib/token-store';
import type { AuthResult, AuthUser, GoogleAuthBody, LoginBody, RegisterBody } from '@/types/api';
import { authApi } from './auth-api';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthed: boolean;
  isAdmin: boolean;
  login: (body: LoginBody) => Promise<void>;
  register: (body: RegisterBody) => Promise<void>;
  google: (body: GoogleAuthBody) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function persist(result: AuthResult): void {
  setSession({ accessToken: result.accessToken, refreshToken: result.refreshToken, user: result.user });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(subscribe, getSession, getSession);
  const user = session.user;

  const login = useCallback(async (body: LoginBody) => persist(await authApi.login(body)), []);
  const register = useCallback(async (body: RegisterBody) => persist(await authApi.register(body)), []);
  const google = useCallback(async (body: GoogleAuthBody) => persist(await authApi.google(body)), []);

  const logout = useCallback(async () => {
    const rt = getSession().refreshToken;
    if (rt) await authApi.logout(rt).catch(() => undefined);
    clearSession();
  }, []);

  const refreshUser = useCallback(async () => {
    const fresh = await authApi.me();
    setSession({ user: fresh });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthed: !!user,
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      google,
      logout,
      refreshUser,
    }),
    [user, login, register, google, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
