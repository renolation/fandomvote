import { api } from '@/lib/api-client';
import type {
  Campaign,
  CampaignIdol,
  CampaignResult,
  CampaignStatus,
  LeaderboardEntry,
} from '@/types/api';

export const campaignApi = {
  list: (status?: CampaignStatus) => api.get<Campaign[]>('/campaigns', { params: { status } }),
  get: (id: string) => api.get<Campaign>(`/campaigns/${id}`),
  leaderboard: (id: string) => api.get<LeaderboardEntry[]>(`/campaigns/${id}/leaderboard`),
  result: (id: string) => api.get<CampaignResult>(`/campaigns/${id}/result`),
  addIdol: (id: string, idolId: string) =>
    api.post<CampaignIdol>(`/campaigns/${id}/idols`, { idolId }),
};
