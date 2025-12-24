import { InferRequestType, InferResponseType } from 'hono';

import { client } from '@/lib/hono';
import { createMutation } from '@/lib/react-query/mutation-factory';
import { invalidateTaskQueries } from '@/lib/react-query/cache-utils';

type ResponseType = InferResponseType<(typeof client.api.tasks)[':taskId']['$delete'], 200>;
type RequestType = InferRequestType<(typeof client.api.tasks)[':taskId']['$delete']>;

/**
 * Hook to delete a task
 * 
 * Uses the mutation factory for consistent error handling and cache invalidation.
 * Automatically invalidates related queries (task, tasks list, workspace analytics, project analytics).
 * 
 * @example
 * ```tsx
 * const deleteTask = useDeleteTask();
 * deleteTask.mutate({ param: { taskId: 'task-123' } });
 * ```
 */
export const useDeleteTask = createMutation<ResponseType, Error, RequestType>({
  mutationFn: async ({ param }) => {
    const response = await client.api.tasks[':taskId']['$delete']({ param });

    if (!response.ok) throw new Error('Failed to delete task.');

    return await response.json();
  },
  successMessage: 'Task deleted.',
  logPrefix: '[DELETE_TASK]',
  onSuccessInvalidate: (queryClient, response) => {
    // Hono responses have { data } wrapper, extract it
    const data = 'data' in response ? response.data : response;
    // Use centralized cache invalidation utility
    invalidateTaskQueries(queryClient, data.$id, data.workspaceId, data.projectId);
  },
});
