import { api } from '@/lib/api-client';
import type {
  BoardEntry,
  LeaderboardPeriod,
  LeaderboardSnapshot,
  LeaderboardType,
  MyRank,
} from '@/types/api';

export const leaderboardApi = {
  board: (type: LeaderboardType, period: LeaderboardPeriod, limit = 20) =>
    api.get<BoardEntry[]>('/leaderboards', { params: { type, period, limit } }),
  myRank: (type: LeaderboardType, period: LeaderboardPeriod) =>
    api.get<MyRank>('/leaderboards/me', { params: { type, period } }),
  // admin
  pending: () => api.get<LeaderboardSnapshot[]>('/admin/leaderboards/pending'),
  approve: (id: number) => api.post<LeaderboardSnapshot>(`/admin/leaderboards/${id}/approve`),
  grant: (id: number) => api.post<LeaderboardSnapshot>(`/admin/leaderboards/${id}/grant`),
};
