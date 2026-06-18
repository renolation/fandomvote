import { api } from '@/lib/api-client';
import type { ReferralStats } from '@/types/api';

export const referralApi = {
  me: () => api.get<ReferralStats>('/referrals/me'),
};
