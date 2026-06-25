import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Campaign, CreateCampaignBody } from '@/types/api';
import { adminApi, type ResolutionResult } from './admin-api';

export function useAdminUsers(search: string, flaggedOnly: boolean) {
  return useInfiniteQuery({
    queryKey: ['admin-users', search, flaggedOnly],
    queryFn: ({ pageParam }) =>
      adminApi.listUsers({ search: search || undefined, flagged: flaggedOnly || undefined, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

export function useFlagUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; flag: boolean }) =>
      v.flag ? adminApi.flagUser(v.id) : adminApi.unflagUser(v.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
}

export function usePendingIdols() {
  return useQuery({
    queryKey: ['admin-pending-idols'],
    queryFn: () => adminApi.listIdols('PENDING'),
    refetchInterval: 30_000,
  });
}

export function useAnalyticsOverview() {
  return useQuery({ queryKey: ['admin-analytics'], queryFn: adminApi.analyticsOverview });
}

// ---- Đơn hàng PHYSICAL ----
export function useOrders(status: string) {
  return useQuery({
    queryKey: ['admin-orders', status],
    queryFn: () => adminApi.orders(status),
  });
}

export function useOrderAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; action: 'ship' | 'deliver' }) =>
      v.action === 'ship' ? adminApi.shipOrder(v.id) : adminApi.deliverOrder(v.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-orders'] }),
  });
}

// ---- Đối soát tiền ----
export function useReconcileSummary() {
  return useQuery({ queryKey: ['admin-reconcile'], queryFn: adminApi.reconcileSummary });
}

export function useLedger(source: string) {
  return useInfiniteQuery({
    queryKey: ['admin-ledger', source],
    queryFn: ({ pageParam }) =>
      adminApi.ledger({ source: source || undefined, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

type CampaignActionResult =
  | Campaign
  | { closed: boolean }
  | ResolutionResult
  | { refundedUsers: number };

export function useApproveIdol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; approve: boolean }) =>
      v.approve ? adminApi.approveIdol(v.id) : adminApi.rejectIdol(v.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-pending-idols'] }),
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCampaignBody) => adminApi.createCampaign(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

function invalidateCampaign(qc: ReturnType<typeof useQueryClient>, id: string) {
  qc.invalidateQueries({ queryKey: ['campaigns'] });
  qc.invalidateQueries({ queryKey: ['campaign', id] });
  qc.invalidateQueries({ queryKey: ['campaign-result', id] });
}

// ---- Hard-delete (xoá vĩnh viễn) ----
// Map entity → (hàm xoá, queryKey list cần invalidate sau khi xoá).
type DeleteEntity =
  | 'user'
  | 'campaign'
  | 'idol'
  | 'deal'
  | 'offer'
  | 'iapPackage'
  | 'pointEvent'
  | 'gift'
  | 'notification'
  | 'leaderboardSnapshot';

const DELETE_CONFIG: Record<DeleteEntity, { fn: (id: string) => Promise<unknown>; invalidate: string }> = {
  user: { fn: adminApi.deleteUser, invalidate: 'admin-users' },
  campaign: { fn: adminApi.deleteCampaign, invalidate: 'campaigns' },
  idol: { fn: adminApi.deleteIdol, invalidate: 'admin-pending-idols' },
  deal: { fn: adminApi.deleteDeal, invalidate: 'deals' },
  offer: { fn: adminApi.deleteOffer, invalidate: 'offers' },
  iapPackage: { fn: adminApi.deleteIapPackage, invalidate: 'iap-packages' },
  pointEvent: { fn: adminApi.deletePointEvent, invalidate: 'events' },
  gift: { fn: adminApi.deleteGift, invalidate: 'admin-orders' },
  notification: { fn: adminApi.deleteNotification, invalidate: 'notifications' },
  leaderboardSnapshot: { fn: adminApi.deleteLeaderboardSnapshot, invalidate: 'lb-pending' },
};

export function useDeleteAdmin(entity: DeleteEntity) {
  const qc = useQueryClient();
  const cfg = DELETE_CONFIG[entity];
  return useMutation({
    mutationFn: (id: string) => cfg.fn(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [cfg.invalidate] }),
  });
}

export function useCampaignAction() {
  const qc = useQueryClient();
  return useMutation<CampaignActionResult, Error, { id: string; action: 'open' | 'close' | 'resolve' | 'reverse' }>({
    mutationFn: (v) => {
      switch (v.action) {
        case 'open':
          return adminApi.openCampaign(v.id);
        case 'close':
          return adminApi.closeCampaign(v.id);
        case 'resolve':
          return adminApi.resolveCampaign(v.id);
        case 'reverse':
          return adminApi.reverseVotes(v.id);
      }
    },
    onSuccess: (_data, v) => invalidateCampaign(qc, v.id),
  });
}
