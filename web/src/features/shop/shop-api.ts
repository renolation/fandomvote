import { api, newIdempotencyKey } from '@/lib/api-client';
import type {
  CreateAddressBody,
  DailyRewardConfig,
  GiftWalletItem,
  IapPackage,
  OfferTask,
  PointEvent,
  RedeemResult,
  ShippingAddress,
  ShopDeal,
} from '@/types/api';

export const shopApi = {
  deals: () => api.get<ShopDeal[]>('/shop/deals'),
  offers: () => api.get<OfferTask[]>('/shop/offers'),
  iapPackages: () => api.get<IapPackage[]>('/shop/iap-packages'),
  redeem: (dealId: string) =>
    api.post<RedeemResult>(`/shop/deals/${dealId}/redeem`, undefined, {
      idempotencyKey: newIdempotencyKey(),
    }),
  dailyRewardConfig: () => api.get<DailyRewardConfig[]>('/shop/daily-reward'),
  dailyRewardStatus: () => api.get<{ claimedToday: boolean }>('/shop/daily-reward/status'),
  claimDaily: () => api.post<{ greenAwarded: number }>('/shop/daily-reward/claim'),
  gifts: () => api.get<GiftWalletItem[]>('/shop/gifts'),
  useGift: (id: string) => api.post<GiftWalletItem>(`/shop/gifts/${id}/use`),
  confirmGift: (id: string, shippingAddressId: string) =>
    api.post<GiftWalletItem>(`/shop/gifts/${id}/confirm`, { shippingAddressId }),
  addresses: () => api.get<ShippingAddress[]>('/shop/addresses'),
  createAddress: (body: CreateAddressBody) => api.post<ShippingAddress>('/shop/addresses', body),
  activeEvents: () => api.get<PointEvent[]>('/events/active'),
};
