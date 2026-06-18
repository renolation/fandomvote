import axios, { AxiosError } from 'axios';
import { clearSession, getAccessToken, getRefreshToken, setTokens } from './token-store';

// Lỗi nghiệp vụ chuẩn hoá từ envelope { error: { code, message } }.
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';
interface Envelope<T> {
  data?: T;
  error?: { code: string; message: string };
}
export interface RequestOptions {
  idempotencyKey?: string;
  params?: Record<string, unknown>;
}

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const raw = axios.create({ baseURL });

// Refresh single-flight: nhiều request 401 cùng lúc → chỉ refresh 1 lần.
let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const rt = getRefreshToken();
  if (!rt) return null;
  try {
    const res = await raw.post<Envelope<{ accessToken: string; refreshToken: string }>>(
      '/auth/refresh',
      { refreshToken: rt },
    );
    const data = res.data?.data;
    if (data?.accessToken) {
      setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    }
    return null;
  } catch {
    return null; // gồm TOKEN_REUSE_DETECTED → buộc login lại
  }
}

function toApiError(err: unknown): ApiError {
  const e = err as AxiosError<Envelope<unknown>>;
  const apiErr = e.response?.data?.error;
  if (apiErr) return new ApiError(apiErr.code, apiErr.message, e.response?.status ?? 0);
  if (e.response?.status === 429)
    return new ApiError('RATE_LIMITED', 'Quá nhiều yêu cầu, thử lại sau', 429);
  return new ApiError('NETWORK_ERROR', e.message || 'Lỗi kết nối', e.response?.status ?? 0);
}

async function request<T>(method: Method, url: string, body?: unknown, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;

  try {
    const res = await raw.request<Envelope<T>>({ method, url, data: body, params: opts.params, headers });
    return res.data.data as T;
  } catch (err) {
    const e = err as AxiosError<Envelope<unknown>>;
    const isAuthRoute = url.startsWith('/auth/');
    if (e.response?.status === 401 && token && !isAuthRoute) {
      refreshing = refreshing ?? doRefresh();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        const retry = await raw.request<Envelope<T>>({
          method,
          url,
          data: body,
          params: opts.params,
          headers: { ...headers, Authorization: `Bearer ${newToken}` },
        });
        return retry.data.data as T;
      }
      clearSession();
      window.dispatchEvent(new CustomEvent('fdv:logout'));
    }
    throw toApiError(err);
  }
}

export const api = {
  get: <T>(url: string, opts?: RequestOptions) => request<T>('GET', url, undefined, opts),
  post: <T>(url: string, body?: unknown, opts?: RequestOptions) => request<T>('POST', url, body, opts),
  patch: <T>(url: string, body?: unknown, opts?: RequestOptions) => request<T>('PATCH', url, body, opts),
  del: <T>(url: string, opts?: RequestOptions) => request<T>('DELETE', url, undefined, opts),
};

// Idempotency-Key cho vote/convert/redeem — §0.7.
export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}
