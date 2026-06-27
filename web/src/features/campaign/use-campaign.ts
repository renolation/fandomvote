import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CampaignStatus, LeaderboardPeriod } from '@/types/api';
import { useAuth } from '@/features/auth/auth-context';
import { campaignApi } from './campaign-api';

export function useCampaigns(status?: CampaignStatus) {
  return useQuery({ queryKey: ['campaigns', status ?? 'ALL'], queryFn: () => campaignApi.list(status) });
}

export function useCampaign(id: string | undefined) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignApi.get(id!),
    enabled: !!id,
  });
}

export function useLeaderboard(id: string | undefined, poll = true, period?: LeaderboardPeriod) {
  return useQuery({
    queryKey: ['leaderboard', id, period ?? 'all'],
    queryFn: () => campaignApi.leaderboard(id!, period),
    enabled: !!id,
    refetchInterval: poll ? 7_000 : false,
  });
}

export function useCampaignResult(id: string | undefined) {
  return useQuery({
    queryKey: ['campaign-result', id],
    queryFn: () => campaignApi.result(id!),
    enabled: !!id,
  });
}

// Biên lai quyên góp của chính user (chỉ khi đã auth + campaign RESOLVED).
export function useMyReceipt(id: string | undefined, enabled = true) {
  const { isAuthed } = useAuth();
  return useQuery({
    queryKey: ['my-receipt', id],
    queryFn: () => campaignApi.myReceipt(id!),
    enabled: !!id && isAuthed && enabled,
  });
}

export function useAddIdolToCampaign(campaignId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (idolId: string) => campaignApi.addIdol(campaignId, idolId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leaderboard', campaignId] }),
  });
}
