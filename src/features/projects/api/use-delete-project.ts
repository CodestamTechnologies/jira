import { InferRequestType, InferResponseType } from 'hono';

import { client } from '@/lib/hono';
import { createMutation } from '@/lib/react-query/mutation-factory';
import { invalidateProjectQueries } from '@/lib/react-query/cache-utils';

type ResponseType = InferResponseType<(typeof client.api.projects)[':projectId']['$delete'], 200>;
type RequestType = InferRequestType<(typeof client.api.projects)[':projectId']['$delete']>;

/**
 * Hook to delete a project
 * 
 * Uses the mutation factory for consistent error handling and cache invalidation.
 * Automatically invalidates related queries (project, projects list, workspace queries).
 * 
 * @example
 * ```tsx
 * const deleteProject = useDeleteProject();
 * deleteProject.mutate({ param: { projectId: 'project-123' } });
 * ```
 */
export const useDeleteProject = createMutation<ResponseType, Error, RequestType>({
  mutationFn: async ({ param }) => {
    const response = await client.api.projects[':projectId']['$delete']({ param });

    if (!response.ok) throw new Error('Failed to delete project.');

    return await response.json();
  },
  successMessage: 'Project deleted.',
  logPrefix: '[DELETE_PROJECT]',
  onSuccessInvalidate: (queryClient, response) => {
    // Hono responses have { data } wrapper, extract it
    const data = 'data' in response ? response.data : response;
    // Use centralized cache invalidation utility
    invalidateProjectQueries(queryClient, data.$id, data.workspaceId);
  },
});
