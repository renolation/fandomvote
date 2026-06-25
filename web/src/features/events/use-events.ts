import { useQuery } from '@tanstack/react-query';
import { eventsApi } from './events-api';

// Toàn bộ point_events (public) — order starts_at desc theo backend.
export function useAllEvents() {
  return useQuery({ queryKey: ['events', 'all'], queryFn: eventsApi.list });
}
