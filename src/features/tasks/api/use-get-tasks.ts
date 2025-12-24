import { useQuery } from '@tanstack/react-query';

import type { TaskStatus } from '@/features/tasks/types';
import { client } from '@/lib/hono';
import { CACHE_TIMES } from '@/lib/react-query/constants';

/**
 * Props for useGetTasks hook
 */
interface useGetTasksProps {
  /** Workspace ID to fetch tasks for */
  workspaceId: string;
  /** Optional project ID to filter tasks */
  projectId?: string | null;
  /** Optional task status to filter by */
  status?: TaskStatus | null;
  /** Optional search query to filter tasks */
  search?: string | null;
  /** Optional assignee ID to filter tasks */
  assigneeId?: string | null;
  /** Optional due date to filter tasks */
  dueDate?: string | null;
  /** If true, shows all tasks including old done ones */
  showAll?: boolean;
  /** Page number (1-based) for server-side pagination */
  page?: number;
  /** Items per page */
  limit?: number;
}

/**
 * Hook to fetch tasks with filtering and pagination
 * 
 * Features:
 * - Server-side filtering and pagination for scalability
 * - Automatic caching (1 minute staleTime)
 * - Cache invalidation on mutations
 * - Query key includes all filters for proper cache isolation
 * 
 * @param props - Query parameters
 * @returns React Query result with tasks data
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useGetTasks({
 *   workspaceId: 'workspace-123',
 *   status: TaskStatus.IN_PROGRESS,
 *   page: 1,
 *   limit: 10,
 * });
 * ```
 */
export const useGetTasks = ({
  workspaceId,
  projectId,
  status,
  search,
  assigneeId,
  dueDate,
  showAll,
  page,
  limit,
}: useGetTasksProps) => {
  const query = useQuery({
    // Query key includes all parameters to ensure proper cache isolation
    // Different filters = different cache entries
    queryKey: ['tasks', workspaceId, projectId, status, search, assigneeId, dueDate, showAll, page, limit],
    
    queryFn: async () => {
      const response = await client.api.tasks.$get({
        query: {
          workspaceId,
          projectId: projectId ?? undefined,
          status: status ?? undefined,
          search: search ?? undefined,
          assigneeId: assigneeId ?? undefined,
          dueDate: dueDate ?? undefined,
          showAll: showAll ? 'true' : undefined,
          page: page?.toString(),
          limit: limit?.toString(),
        },
      });

      if (!response.ok) throw new Error('Failed to fetch tasks.');

      const { data } = await response.json();

      return data;
    },
    
    // Tasks change more frequently than projects/members
    // 1 minute staleTime balances freshness with performance
    staleTime: CACHE_TIMES.FREQUENT, // 1 minute
    
    // Don't refetch on window focus
    // Tasks are updated via mutations which automatically invalidate cache
    // This reduces unnecessary database reads
    refetchOnWindowFocus: false,
  });

  return query;
};
