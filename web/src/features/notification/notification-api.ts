import { api } from '@/lib/api-client';
import type { AppNotification, Paginated } from '@/types/api';

export const notificationApi = {
  list: (cursor?: string, limit = 20) =>
    api.get<Paginated<AppNotification>>('/notifications', { params: { cursor, limit } }),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
  markRead: (id: string) => api.patch<{ success: true }>(`/notifications/${id}/read`),
  markAllRead: () => api.patch<{ success: true }>('/notifications/read-all'),
};
