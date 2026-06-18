import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api-client';

// Không retry lỗi nghiệp vụ 4xx; chỉ retry lỗi mạng/5xx 1 lần.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});
