import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateAddressBody } from '@/types/api';
import { useAuth } from '@/features/auth/auth-context';
import { shopApi } from './shop-api';

export function useDeals() {
  return useQuery({ queryKey: ['deals'], queryFn: shopApi.deals });
}

export function useOffers() {
  return useQuery({ queryKey: ['offers'], queryFn: shopApi.offers });
}

export function useIapPackages() {
  return useQuery({ queryKey: ['iap-packages'], queryFn: shopApi.iapPackages });
}

export function useActiveEvents() {
  return useQuery({ queryKey: ['events'], queryFn: shopApi.activeEvents, refetchInterval: 30_000 });
}

export function useDailyRewardConfig() {
  return useQuery({ queryKey: ['daily-reward'], queryFn: shopApi.dailyRewardConfig });
}

export function useDailyRewardStatus() {
  const { isAuthed } = useAuth();
  return useQuery({ queryKey: ['daily-reward-status'], queryFn: shopApi.dailyRewardStatus, enabled: isAuthed });
}

export function useGifts() {
  return useQuery({ queryKey: ['gifts'], queryFn: shopApi.gifts });
}

export function useAddresses() {
  return useQuery({ queryKey: ['addresses'], queryFn: shopApi.addresses });
}

export function useRedeemDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dealId: string) => shopApi.redeem(dealId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['balance'] });
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['gifts'] });
    },
  });
}

export function useClaimDaily() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => shopApi.claimDaily(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['balance'] });
      qc.invalidateQueries({ queryKey: ['daily-reward-status'] });
    },
  });
}

export function useUseGift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shopApi.useGift(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gifts'] }),
  });
}

export function useConfirmGift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; shippingAddressId: string }) =>
      shopApi.confirmGift(v.id, v.shippingAddressId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gifts'] }),
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAddressBody) => shopApi.createAddress(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  });
}
