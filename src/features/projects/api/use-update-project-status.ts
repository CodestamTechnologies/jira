import { InferRequestType, InferResponseType } from 'hono';

import { client } from '@/lib/hono';
import { createMutation } from '@/lib/react-query/mutation-factory';
import { invalidateProjectQueries } from '@/lib/react-query/cache-utils';

type ResponseType = InferResponseType<(typeof client.api.projects)[':projectId']['status']['$patch'], 200>;
type RequestType = InferRequestType<(typeof client.api.projects)[':projectId']['status']['$patch']>;

/**
 * Hook to update project status (isClosed field)
 * 
 * This is separated from the main update endpoint to avoid conflicts
 * when updating project details and closing settings simultaneously.
 * 
 * @example
 * ```tsx
 * const updateStatus = useUpdateProjectStatus();
 * updateStatus.mutate({ 
 *   param: { projectId: 'project-123' },
 *   form: { isClosed: true, workspaceId: 'workspace-123' }
 * });
 * ```
 */
export const useUpdateProjectStatus = createMutation<ResponseType, Error, RequestType>({
  mutationFn: async ({ form, param }) => {
    const response = await client.api.projects[':projectId']['status']['$patch']({ form, param });

    if (!response.ok) throw new Error('Failed to update project status.');

    return await response.json();
  },
  successMessage: 'Project status updated.',
  logPrefix: '[UPDATE_PROJECT_STATUS]',
  onSuccessInvalidate: (queryClient, response) => {
    // Hono responses have { data } wrapper, extract it
    const data = 'data' in response ? response.data : response;
    // Invalidate project-specific queries
    invalidateProjectQueries(queryClient, data.$id, data.workspaceId);
    // Also invalidate tasks for this project
    queryClient.invalidateQueries({
      queryKey: ['tasks', data.workspaceId, data.$id],
      exact: false,
    });
  },
});
