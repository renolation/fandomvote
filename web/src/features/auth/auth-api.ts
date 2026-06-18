import { api } from '@/lib/api-client';
import type {
  AuthResult,
  AuthUser,
  GoogleAuthBody,
  LoginBody,
  RegisterBody,
  VerificationChannel,
} from '@/types/api';

export const authApi = {
  register: (body: RegisterBody) => api.post<AuthResult>('/auth/register', body),
  login: (body: LoginBody) => api.post<AuthResult>('/auth/login', body),
  google: (body: GoogleAuthBody) => api.post<AuthResult>('/auth/google', body),
  me: () => api.get<AuthUser>('/auth/me'),
  logout: (refreshToken: string) => api.post<{ success: true }>('/auth/logout', { refreshToken }),
  requestVerify: (channel: VerificationChannel) =>
    api.post<{ sent: true }>('/auth/verify/request', { channel }),
  confirmVerify: (channel: VerificationChannel, otp: string) =>
    api.post<{ verified: true }>('/auth/verify/confirm', { channel, otp }),
};
