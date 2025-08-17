// React Query client configuration
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data will be considered stale after 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache data for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Retry delay increases exponentially
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Don't refetch on window focus in development
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});