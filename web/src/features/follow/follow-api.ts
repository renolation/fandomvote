import { api } from '@/lib/api-client';
import type { Idol } from '@/types/api';

export const followApi = {
  listFollows: () => api.get<Idol[]>('/follows'),
  follow: (idolId: string) => api.post<{ followed: boolean }>(`/follows/${idolId}`),
  unfollow: (idolId: string) => api.post<{ followed: boolean }>(`/follows/${idolId}/unfollow`),
};
