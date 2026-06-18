import { useQuery } from '@tanstack/react-query';
import { referralApi } from './referral-api';

export function useReferralStats() {
  return useQuery({ queryKey: ['referral'], queryFn: referralApi.me });
}
