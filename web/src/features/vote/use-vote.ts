import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CastVoteBody } from '@/types/api';
import { voteApi } from './vote-api';

export function useCastVote(campaignId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CastVoteBody) => voteApi.cast(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['balance'] });
      qc.invalidateQueries({ queryKey: ['leaderboard', campaignId] });
      qc.invalidateQueries({ queryKey: ['vote-activity'] });
    },
  });
}

export function useVoteActivity() {
  return useInfiniteQuery({
    queryKey: ['vote-activity'],
    queryFn: ({ pageParam }) => voteApi.activity(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}
