import { api } from '@/lib/api-client';
import type {
  AdminLedgerRow,
  AdminOrder,
  AdminUser,
  AnalyticsOverview,
  Campaign,
  CreateCampaignBody,
  CreateDealBody,
  Idol,
  IdolStatus,
  Paginated,
  ReconcileSummary,
  ShopDeal,
  UpdateCampaignBody,
  UpdateDealBody,
  UpdateUserBody,
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
  updateCampaign: (id: string, body: UpdateCampaignBody) =>
    api.post<Campaign>(`/admin/campaigns/${id}/update`, body),
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
  updateUser: (id: string, body: UpdateUserBody) =>
    api.post<AdminUser>(`/admin/users/${id}/update`, body),

  // Đơn hàng PHYSICAL — fulfilment.
  // Deal (gồm cả deal đã tắt — khác /shop/deals chỉ trả deal active).
  deals: () => api.get<ShopDeal[]>('/admin/deals'),
  createDeal: (body: CreateDealBody) => api.post<ShopDeal>('/admin/deals', body),
  updateDeal: (id: string, body: UpdateDealBody) =>
    api.post<ShopDeal>(`/admin/deals/${id}/update`, body),
  orders: (status?: string) => api.get<AdminOrder[]>('/admin/orders', { params: { status } }),
  shipOrder: (id: string) => api.post<AdminOrder>(`/admin/orders/${id}/ship`),
  deliverOrder: (id: string) => api.post<AdminOrder>(`/admin/orders/${id}/deliver`),

  // Đối soát tiền — READ-ONLY.
  reconcileSummary: () => api.get<ReconcileSummary>('/admin/reconcile/summary'),
  ledger: (params: { source?: string; userId?: string; cursor?: string }) =>
    api.get<Paginated<AdminLedgerRow>>('/admin/ledger', { params }),

  // Hard-delete (xoá vĩnh viễn, cascade) — chỉ DEV. Tất cả trả { deleted: true }.
  deleteUser: (id: string) => api.post<DeleteResult>(`/admin/users/${id}/delete`),
  deleteCampaign: (id: string) => api.post<DeleteResult>(`/admin/campaigns/${id}/delete`),
  deleteIdol: (id: string) => api.post<DeleteResult>(`/admin/idols/${id}/delete`),
  deleteDeal: (id: string) => api.post<DeleteResult>(`/admin/deals/${id}/delete`),
  deleteOffer: (id: string) => api.post<DeleteResult>(`/admin/offers/${id}/delete`),
  deleteIapPackage: (id: string) => api.post<DeleteResult>(`/admin/iap-packages/${id}/delete`),
  deletePointEvent: (id: string) => api.post<DeleteResult>(`/admin/point-events/${id}/delete`),
  deleteGift: (id: string) => api.post<DeleteResult>(`/admin/gifts/${id}/delete`),
  deleteNotification: (id: string) => api.post<DeleteResult>(`/admin/notifications/${id}/delete`),
  deleteLeaderboardSnapshot: (id: number | string) =>
    api.post<DeleteResult>(`/admin/leaderboard-snapshots/${id}/delete`),
};

export interface DeleteResult {
  deleted: boolean;
}
