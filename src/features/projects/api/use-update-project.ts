import { InferRequestType, InferResponseType } from 'hono';

import { client } from '@/lib/hono';
import { createMutation } from '@/lib/react-query/mutation-factory';
import { invalidateProjectQueries, invalidateWorkspaceQueries } from '@/lib/react-query/cache-utils';

type ResponseType = InferResponseType<(typeof client.api.projects)[':projectId']['$patch'], 200>;
type RequestType = InferRequestType<(typeof client.api.projects)[':projectId']['$patch']>;

/**
 * Hook to update an existing project
 * 
 * Uses the mutation factory for consistent error handling and cache invalidation.
 * Automatically invalidates related queries (project, projects list, tasks, workspace queries).
 * 
 * @example
 * ```tsx
 * const updateProject = useUpdateProject();
 * updateProject.mutate({ 
 *   param: { projectId: 'project-123' },
 *   form: projectFormData
 * });
 * ```
 */
export const useUpdateProject = createMutation<ResponseType, Error, RequestType>({
  mutationFn: async ({ form, param }) => {
    const response = await client.api.projects[':projectId']['$patch']({ form, param });

    if (!response.ok) throw new Error('Failed to update project.');

    return await response.json();
  },
  successMessage: 'Project updated.',
  logPrefix: '[UPDATE_PROJECT]',
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
