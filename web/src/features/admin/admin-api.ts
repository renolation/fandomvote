import { api } from '@/lib/api-client';
import type { Campaign, CreateCampaignBody, Idol } from '@/types/api';

export interface ResolutionResult {
  outcome: 'A' | 'B';
  topIdolId: string | null;
  topVotes: number;
  goldTotal: number;
  fundVnd: number | null;
  receiptNo: string | null;
}

export const adminApi = {
  approveIdol: (id: string) => api.post<Idol>(`/admin/idols/${id}/approve`),
  rejectIdol: (id: string) => api.post<Idol>(`/admin/idols/${id}/reject`),
  createCampaign: (body: CreateCampaignBody) => api.post<Campaign>('/admin/campaigns', body),
  openCampaign: (id: string) => api.post<Campaign>(`/admin/campaigns/${id}/open`),
  closeCampaign: (id: string) => api.post<{ closed: boolean }>(`/admin/campaigns/${id}/close`),
  resolveCampaign: (id: string) => api.post<ResolutionResult>(`/admin/campaigns/${id}/resolve`),
  reverseVotes: (id: string) =>
    api.post<{ refundedUsers: number }>(`/admin/campaigns/${id}/reverse-votes`),
};
