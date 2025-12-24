import { InferRequestType, InferResponseType } from 'hono';

import { client } from '@/lib/hono';
import { createMutation } from '@/lib/react-query/mutation-factory';
import { invalidateTaskQueries } from '@/lib/react-query/cache-utils';

type ResponseType = InferResponseType<(typeof client.api.tasks)[':taskId']['$patch'], 200>;
type RequestType = InferRequestType<(typeof client.api.tasks)[':taskId']['$patch']>;

/**
 * Hook to update an existing task
 * 
 * Uses the mutation factory for consistent error handling and cache invalidation.
 * Automatically invalidates related queries (task, tasks list, workspace analytics, project analytics).
 * 
 * @example
 * ```tsx
 * const updateTask = useUpdateTask();
 * updateTask.mutate({ 
 *   param: { taskId: 'task-123' },
 *   json: { name: 'Updated task name' }
 * });
 * ```
 */
export const useUpdateTask = createMutation<ResponseType, Error, RequestType>({
  mutationFn: async ({ json, param }) => {
    const response = await client.api.tasks[':taskId']['$patch']({ json, param });

    if (!response.ok) {
      const errorData = (await response.json()) as { error?: string };
      const errorMessage = errorData.error || 'Failed to update task.';
      throw new Error(errorMessage);
    }

    return await response.json();
  },
  successMessage: 'Task updated.',
  logPrefix: '[UPDATE_TASK]',
  errorMessage: (error) => error.message || 'Failed to update task.',
  onSuccessInvalidate: (queryClient, response) => {
    // Hono responses have { data } wrapper, extract it
    const data = 'data' in response ? response.data : response;
    // Use centralized cache invalidation utility
    invalidateTaskQueries(queryClient, data.$id, data.workspaceId, data.projectId);
  },
});
