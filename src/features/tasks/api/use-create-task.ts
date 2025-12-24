import { InferRequestType, InferResponseType } from 'hono';

import { client } from '@/lib/hono';
import { createMutation } from '@/lib/react-query/mutation-factory';
import { invalidateTaskQueries } from '@/lib/react-query/cache-utils';

type ResponseType = InferResponseType<(typeof client.api.tasks)['$post'], 200>;
type RequestType = InferRequestType<(typeof client.api.tasks)['$post']>;

/**
 * Hook to create a new task
 * 
 * Uses the mutation factory for consistent error handling and cache invalidation.
 * Automatically invalidates related queries (tasks, workspace analytics, project analytics).
 * 
 * @example
 * ```tsx
 * const createTask = useCreateTask();
 * createTask.mutate({ json: taskData });
 * ```
 */
export const useCreateTask = createMutation<ResponseType, Error, RequestType>({
  mutationFn: async ({ json }) => {
    const response = await client.api.tasks['$post']({ json });

    if (!response.ok) throw new Error('Failed to create task.');

    return await response.json();
  },
  successMessage: 'Task created.',
  logPrefix: '[CREATE_TASK]',
  onSuccessInvalidate: (queryClient, response) => {
    // Hono responses have { data } wrapper, extract it
    const data = 'data' in response ? response.data : response;
    // Use centralized cache invalidation utility
    invalidateTaskQueries(queryClient, data.$id, data.workspaceId, data.projectId);
  },
});
