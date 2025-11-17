import { useQuery } from '@tanstack/react-query';

interface UncommentedTask {
  id: string;
  name: string;
}

interface PendingTasksResponse {
  uncommentedTasks: UncommentedTask[];
}

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
    refetchOnWindowFocus: true,
  });
};

