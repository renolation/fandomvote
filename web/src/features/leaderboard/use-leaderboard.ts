import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LeaderboardPeriod, LeaderboardType } from '@/types/api';
import { useAuth } from '@/features/auth/auth-context';
import { leaderboardApi } from './leaderboard-api';

export function useBoard(type: LeaderboardType, period: LeaderboardPeriod) {
  return useQuery({
    queryKey: ['board', type, period],
    queryFn: () => leaderboardApi.board(type, period),
    refetchInterval: 15_000,
  });
}

export function useMyRank(type: LeaderboardType, period: LeaderboardPeriod) {
  const { isAuthed } = useAuth();
  return useQuery({
    queryKey: ['my-rank', type, period],
    queryFn: () => leaderboardApi.myRank(type, period),
    enabled: isAuthed,
  });
}

export function usePendingRewards() {
  return useQuery({ queryKey: ['lb-pending'], queryFn: leaderboardApi.pending });
}

export function useRewardAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: number; action: 'approve' | 'grant' }) =>
      v.action === 'approve' ? leaderboardApi.approve(v.id) : leaderboardApi.grant(v.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lb-pending'] }),
  });
}
