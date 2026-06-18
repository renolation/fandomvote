import type { AuthUser } from '@/types/api';

// Single source of truth cho session. api-client đọc trực tiếp; React subscribe qua useSyncExternalStore.
// Lưu localStorage (lưu ý XSS — phase sau cân nhắc httpOnly cookie). Không log token.
export interface Session {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
}

const ACCESS = 'fdv_access';
const REFRESH = 'fdv_refresh';
const USER = 'fdv_user';

function load(): Session {
  try {
    return {
      accessToken: localStorage.getItem(ACCESS),
      refreshToken: localStorage.getItem(REFRESH),
      user: JSON.parse(localStorage.getItem(USER) ?? 'null') as AuthUser | null,
    };
  } catch {
    return { accessToken: null, refreshToken: null, user: null };
  }
}

let snapshot: Session = load();
const listeners = new Set<() => void>();

function persist(): void {
  const { accessToken, refreshToken, user } = snapshot;
  accessToken ? localStorage.setItem(ACCESS, accessToken) : localStorage.removeItem(ACCESS);
  refreshToken ? localStorage.setItem(REFRESH, refreshToken) : localStorage.removeItem(REFRESH);
  user ? localStorage.setItem(USER, JSON.stringify(user)) : localStorage.removeItem(USER);
  listeners.forEach((l) => l());
}

export function getSession(): Session {
  return snapshot;
}
export function getAccessToken(): string | null {
  return snapshot.accessToken;
}
export function getRefreshToken(): string | null {
  return snapshot.refreshToken;
}
export function setSession(next: Partial<Session>): void {
  snapshot = { ...snapshot, ...next };
  persist();
}
export function setTokens(accessToken: string, refreshToken: string): void {
  snapshot = { ...snapshot, accessToken, refreshToken };
  persist();
}
export function clearSession(): void {
  snapshot = { accessToken: null, refreshToken: null, user: null };
  persist();
}
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
