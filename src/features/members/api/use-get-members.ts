import { useQuery } from '@tanstack/react-query';

import { client } from '@/lib/hono';
import { CACHE_TIMES } from '@/lib/react-query/constants';

/**
 * Props for useGetMembers hook
 */
interface UseGetMembersProps {
  /** Workspace ID to fetch members for */
  workspaceId: string;
  /** 'true' to include inactive members in results */
  includeInactive?: string;
}

/**
 * Hook to fetch members for a workspace
 * 
 * Features:
 * - Moderate cache time (3 minutes) since members change occasionally
 * - No refetch on window focus for better performance
 * - Cache automatically invalidated on member mutations
 * 
 * @param props - Query parameters
 * @returns React Query result with members data
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useGetMembers({
 *   workspaceId: 'workspace-123',
 *   includeInactive: 'true', // Optional: include inactive members
 * });
 * ```
 */
export const useGetMembers = ({ workspaceId, includeInactive }: UseGetMembersProps) => {
  const query = useQuery({
    // Query key includes includeInactive to cache active/inactive separately
    queryKey: ['members', workspaceId, includeInactive],
    
    queryFn: async () => {
      const response = await client.api.members.$get({ 
        query: { 
          workspaceId,
          ...(includeInactive && { includeInactive }),
        } 
      });

      if (!response.ok) throw new Error('Failed to fetch members.');

      const { data } = await response.json();

      return data;
    },
    
    // Members are moderately stable - change less frequently than tasks
    // 3 minute cache balances freshness with performance
    staleTime: CACHE_TIMES.MODERATE, // 3 minutes
    
    // Don't refetch on window focus
    // Members are relatively stable and mutations invalidate cache
    refetchOnWindowFocus: false,
  });

  return query;
};
