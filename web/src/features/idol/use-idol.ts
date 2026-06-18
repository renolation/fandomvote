import { useMutation, useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/lib/use-debounce';
import type { NominateIdolBody } from '@/types/api';
import { idolApi } from './idol-api';

export function useApprovedIdols(search: string) {
  const q = useDebounce(search, 400);
  return useQuery({ queryKey: ['idols', q], queryFn: () => idolApi.list(q || undefined) });
}

// Check trùng real-time (debounce) — §5.
export function useDuplicateCheck(name: string) {
  const q = useDebounce(name.trim(), 400);
  return useQuery({
    queryKey: ['idol-check', q],
    queryFn: () => idolApi.check(q),
    enabled: q.length > 0,
  });
}

export function useNominateIdol() {
  return useMutation({ mutationFn: (body: NominateIdolBody) => idolApi.nominate(body) });
}
