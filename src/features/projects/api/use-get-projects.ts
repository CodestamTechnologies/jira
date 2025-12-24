import { useQuery } from '@tanstack/react-query';

import { client } from '@/lib/hono';
import { CACHE_TIMES } from '@/lib/react-query/constants';

/**
 * Props for useGetProjects hook
 */
interface useGetProjectsProps {
  /** Workspace ID to fetch projects for */
  workspaceId: string;
  /** @deprecated Kept for backward compatibility, always returns all projects */
  showAll?: boolean;
}

/**
 * Hook to fetch all projects for a workspace
 * 
 * Features:
 * - Long cache time (5 minutes) since projects change infrequently
 * - No refetch on window focus for better performance
 * - Cache automatically invalidated on project mutations
 * 
 * @param props - Query parameters
 * @returns React Query result with projects data
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useGetProjects({
 *   workspaceId: 'workspace-123',
 * });
 * ```
 */
export const useGetProjects = ({ workspaceId, showAll }: useGetProjectsProps) => {
  const query = useQuery({
    queryKey: ['projects', workspaceId],
    
    queryFn: async () => {
      const response = await client.api.projects.$get({
        query: { workspaceId },
      });

      if (!response.ok) throw new Error('Failed to fetch projects.');

      const { data } = await response.json();

      return data;
    },
    
    // Projects are stable data that rarely changes
    // 5 minute cache reduces database reads significantly
    staleTime: CACHE_TIMES.STABLE, // 5 minutes
    
    // Don't refetch on window focus
    // Projects are relatively stable and mutations invalidate cache
    refetchOnWindowFocus: false,
  });

  return query;
};
