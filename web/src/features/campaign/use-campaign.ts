import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CampaignStatus } from '@/types/api';
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

export function useLeaderboard(id: string | undefined, poll = true) {
  return useQuery({
    queryKey: ['leaderboard', id],
    queryFn: () => campaignApi.leaderboard(id!),
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

export function useAddIdolToCampaign(campaignId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (idolId: string) => campaignApi.addIdol(campaignId, idolId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leaderboard', campaignId] }),
  });
}
