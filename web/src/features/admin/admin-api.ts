import { api } from '@/lib/api-client';
import type {
  AdminLedgerRow,
  AdminOrder,
  AdminUser,
  AnalyticsOverview,
  Campaign,
  CreateCampaignBody,
  Idol,
  IdolStatus,
  Paginated,
  ReconcileSummary,
} from '@/types/api';

export interface ResolutionResult {
  outcome: 'A' | 'B';
  topIdolId: string | null;
  topVotes: number;
  goldTotal: number;
  fundVnd: number | null;
  receiptNo: string | null;
}

export const adminApi = {
  listIdols: (status: IdolStatus = 'PENDING', cursor?: string) =>
    api.get<Paginated<Idol>>('/admin/idols', { params: { status, cursor } }),
  approveIdol: (id: string) => api.post<Idol>(`/admin/idols/${id}/approve`),
  rejectIdol: (id: string) => api.post<Idol>(`/admin/idols/${id}/reject`),
  createCampaign: (body: CreateCampaignBody) => api.post<Campaign>('/admin/campaigns', body),
  openCampaign: (id: string) => api.post<Campaign>(`/admin/campaigns/${id}/open`),
  closeCampaign: (id: string) => api.post<{ closed: boolean }>(`/admin/campaigns/${id}/close`),
  resolveCampaign: (id: string) => api.post<ResolutionResult>(`/admin/campaigns/${id}/resolve`),
  reverseVotes: (id: string) =>
    api.post<{ refundedUsers: number }>(`/admin/campaigns/${id}/reverse-votes`),
  analyticsOverview: () => api.get<AnalyticsOverview>('/admin/analytics/overview'),
  listUsers: (params: { search?: string; flagged?: boolean; cursor?: string }) =>
    api.get<Paginated<AdminUser>>('/admin/users', {
      params: { search: params.search, flagged: params.flagged ? 'true' : undefined, cursor: params.cursor },
    }),
  flagUser: (id: string) => api.post<AdminUser>(`/admin/users/${id}/flag`),
  unflagUser: (id: string) => api.post<AdminUser>(`/admin/users/${id}/unflag`),

  // Đơn hàng PHYSICAL — fulfilment.
  orders: (status?: string) => api.get<AdminOrder[]>('/admin/orders', { params: { status } }),
  shipOrder: (id: string) => api.post<AdminOrder>(`/admin/orders/${id}/ship`),
  deliverOrder: (id: string) => api.post<AdminOrder>(`/admin/orders/${id}/deliver`),

  // Đối soát tiền — READ-ONLY.
  reconcileSummary: () => api.get<ReconcileSummary>('/admin/reconcile/summary'),
  ledger: (params: { source?: string; userId?: string; cursor?: string }) =>
    api.get<Paginated<AdminLedgerRow>>('/admin/ledger', { params }),
};
