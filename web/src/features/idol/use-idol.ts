import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@/lib/use-debounce';
import { useAuth } from '@/features/auth/auth-context';
import type { NominateIdolBody } from '@/types/api';
import { idolApi } from './idol-api';

export function useApprovedIdols(search: string) {
  const q = useDebounce(search, 400);
  return useQuery({ queryKey: ['idols', q], queryFn: () => idolApi.list(q || undefined) });
}

// Đề cử của tôi (chỉ khi đã auth) — hiển thị ở profile.
export function useMyNominations() {
  const { isAuthed } = useAuth();
  return useQuery({ queryKey: ['my-nominations'], queryFn: idolApi.mine, enabled: isAuthed });
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: NominateIdolBody) => idolApi.nominate(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-nominations'] }),
  });
}
