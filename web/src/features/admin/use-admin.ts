import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Campaign, CreateCampaignBody } from '@/types/api';
import { adminApi, type ResolutionResult } from './admin-api';

export function usePendingIdols() {
  return useQuery({
    queryKey: ['admin-pending-idols'],
    queryFn: () => adminApi.listIdols('PENDING'),
    refetchInterval: 30_000,
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
