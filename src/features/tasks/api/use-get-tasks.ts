import { useQuery } from '@tanstack/react-query';

import type { TaskStatus } from '@/features/tasks/types';
import { client } from '@/lib/hono';

interface useGetTasksProps {
  workspaceId: string;
  projectId?: string | null;
  status?: TaskStatus | null;
  search?: string | null;
  assigneeId?: string | null;
  dueDate?: string | null;
  showAll?: boolean; // If true, shows all tasks including old done ones
  page?: number; // Page number (1-based) for server-side pagination
  limit?: number; // Items per page
}

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
  });

  return query;
};
