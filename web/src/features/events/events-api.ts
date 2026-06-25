import { api } from '@/lib/api-client';
import type { PointEvent } from '@/types/api';

export const eventsApi = {
  list: () => api.get<PointEvent[]>('/events/all'),
};
