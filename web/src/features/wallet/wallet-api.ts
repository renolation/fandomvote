import { api, newIdempotencyKey } from '@/lib/api-client';
import type { Balances, Paginated, WalletLedgerRow } from '@/types/api';

export const walletApi = {
  balance: () => api.get<Balances>('/wallet/balance'),
  ledger: (cursor?: string, limit = 20) =>
    api.get<Paginated<WalletLedgerRow>>('/wallet/ledger', { params: { cursor, limit } }),
  convertDiamond: (diamonds: number) =>
    api.post<Balances>('/wallet/convert-diamond', { diamonds }, { idempotencyKey: newIdempotencyKey() }),
};
