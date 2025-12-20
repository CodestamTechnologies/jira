import { useQuery } from '@tanstack/react-query';

/**
 * Types for pending tasks API
 */
interface UncommentedTask {
  id: string;
  name: string;
}

interface PendingTasksResponse {
  uncommentedTasks: UncommentedTask[];
}

/**
 * Hook to fetch pending tasks (uncommented IN_PROGRESS tasks)
 * 
 * @param workspaceId - Workspace ID to fetch tasks for
 * @returns Query result with pending tasks
 * 
 * @remarks
 * - Caches results for 30 seconds to reduce unnecessary API calls
 * - Refetches on window focus to keep data fresh
 * - Only enabled when workspaceId is provided
 */
export const useGetPendingTasks = (workspaceId: string | undefined) => {
  return useQuery<PendingTasksResponse>({
    queryKey: ['pending-tasks', workspaceId],
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('Workspace ID is required');
      }

      const response = await fetch(`/api/attendance/pending-tasks?workspaceId=${workspaceId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch pending tasks');
      }

      return response.json();
    },
    enabled: !!workspaceId,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true,
  });
};
