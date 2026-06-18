import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/auth-context';
import { walletApi } from './wallet-api';

// Chỉ fetch khi đã auth (guest xem campaign không gọi ví).
export function useBalance() {
  const { isAuthed } = useAuth();
  return useQuery({
    queryKey: ['balance'],
    queryFn: walletApi.balance,
    enabled: isAuthed,
    refetchInterval: isAuthed ? 10_000 : false,
  });
}

export function useLedger() {
  return useInfiniteQuery({
    queryKey: ['ledger'],
    queryFn: ({ pageParam }) => walletApi.ledger(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

export function useConvertDiamond() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (diamonds: number) => walletApi.convertDiamond(diamonds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['balance'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
    },
  });
}
