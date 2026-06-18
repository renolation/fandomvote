import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { walletApi } from './wallet-api';

export function useBalance() {
  return useQuery({ queryKey: ['balance'], queryFn: walletApi.balance, refetchInterval: 10_000 });
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
