import { api } from '@/lib/api-client';
import type {
  Campaign,
  CampaignIdol,
  CampaignResult,
  CampaignStatus,
  DonationReceipt,
  LeaderboardEntry,
  LeaderboardPeriod,
} from '@/types/api';

export const campaignApi = {
  list: (status?: CampaignStatus) => api.get<Campaign[]>('/campaigns', { params: { status } }),
  get: (id: string) => api.get<Campaign>(`/campaigns/${id}`),
  leaderboard: (id: string, period?: LeaderboardPeriod) =>
    api.get<LeaderboardEntry[]>(`/campaigns/${id}/leaderboard`, { params: { period } }),
  result: (id: string) => api.get<CampaignResult>(`/campaigns/${id}/result`),
  myReceipt: (id: string) => api.get<DonationReceipt | null>(`/campaigns/${id}/receipt`),
  addIdol: (id: string, idolId: string) =>
    api.post<CampaignIdol>(`/campaigns/${id}/idols`, { idolId }),
};
