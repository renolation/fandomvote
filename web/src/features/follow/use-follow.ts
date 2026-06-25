import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/auth-context';
import { followApi } from './follow-api';

// Idol đang theo dõi của user hiện tại — chỉ tải khi đã auth.
export function useFollows() {
  const { isAuthed } = useAuth();
  return useQuery({
    queryKey: ['follows'],
    queryFn: followApi.listFollows,
    enabled: isAuthed,
  });
}

export function useToggleFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { idolId: string; following: boolean }) =>
      v.following ? followApi.unfollow(v.idolId) : followApi.follow(v.idolId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['follows'] }),
  });
}
