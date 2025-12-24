'use client';

import { QueryClient, QueryClientProvider, isServer } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';

import { CACHE_TIMES, RETRY_CONFIG } from '@/lib/react-query/constants';

/**
 * Creates a new QueryClient with optimized default settings
 * 
 * These defaults balance performance and data freshness:
 * - Reduces unnecessary database reads
 * - Prevents stale data through smart caching
 * - Optimizes for scalability
 * 
 * Individual queries can override these defaults when needed.
 * 
 * @returns Configured QueryClient instance
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 2 minutes
        // This means React Query won't refetch unless data is older than 2 minutes
        staleTime: CACHE_TIMES.MODERATE, // 2 minutes - data considered fresh

        // Cache is kept in memory for 5 minutes after last use
        // This allows instant access to recently viewed data
        gcTime: 5 * 60 * 1000, // 5 minutes - cache kept in memory (formerly cacheTime)

        // Don't refetch on window focus by default
        // This reduces unnecessary DB reads when user switches tabs
        // Individual queries can override this for time-sensitive data (e.g., notifications)
        refetchOnWindowFocus: false,

        // Don't refetch on reconnect by default
        // Prevents excessive refetching when network reconnects
        refetchOnReconnect: false,

        // Retry failed requests once
        // Balances resilience with fast failure for user feedback
        retry: RETRY_CONFIG.DEFAULT,
      },
    },
  });
}

/**
 * Singleton QueryClient for browser environment
 * 
 * Reusing the same QueryClient instance across renders ensures:
 * - Cache is preserved between component remounts
 * - Query deduplication works correctly
 * - Memory is managed efficiently
 */
let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Gets or creates a QueryClient instance
 * 
 * - Server: Creates new instance for each request (SSR)
 * - Browser: Reuses singleton instance (SPA)
 * 
 * @returns QueryClient instance
 */
function getQueryClient() {
  if (isServer) {
    // Server-side: Create new instance for each request
    // This ensures data isolation between requests
    return makeQueryClient();
  } else {
    // Browser: Reuse singleton instance
    // This preserves cache across component remounts
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

/**
 * QueryProvider Component
 * 
 * Provides React Query context to the application.
 * Wraps the app to enable data fetching, caching, and synchronization.
 * 
 * @param children - React children to wrap with QueryProvider
 * 
 * @example
 * ```tsx
 * <QueryProvider>
 *   <App />
 * </QueryProvider>
 * ```
 */
export const QueryProvider = ({ children }: PropsWithChildren) => {
  const queryClient = getQueryClient();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
