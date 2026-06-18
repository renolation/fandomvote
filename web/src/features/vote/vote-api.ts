import { api, newIdempotencyKey } from '@/lib/api-client';
import type { CastVoteBody, Paginated, VoteLog, VoteResult } from '@/types/api';

export const voteApi = {
  cast: (body: CastVoteBody) =>
    api.post<VoteResult>('/votes', body, { idempotencyKey: newIdempotencyKey() }),
  activity: (cursor?: string, limit = 20) =>
    api.get<Paginated<VoteLog>>('/votes/activity', { params: { cursor, limit } }),
};
