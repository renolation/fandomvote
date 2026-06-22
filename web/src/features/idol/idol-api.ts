import { api } from '@/lib/api-client';
import type { DuplicateCheck, Idol, NominateIdolBody, Paginated } from '@/types/api';

export const idolApi = {
  list: (search?: string, cursor?: string) =>
    api.get<Paginated<Idol>>('/idols', { params: { search, cursor } }),
  mine: () => api.get<Idol[]>('/idols/mine'),
  check: (name: string) => api.get<DuplicateCheck>('/idols/check', { params: { name } }),
  get: (id: string) => api.get<Idol>(`/idols/${id}`),
  nominate: (body: NominateIdolBody) => api.post<Idol>('/idols/nominate', body),
};
