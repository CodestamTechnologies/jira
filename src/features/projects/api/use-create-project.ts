import { InferRequestType, InferResponseType } from 'hono';

import { client } from '@/lib/hono';
import { createMutation } from '@/lib/react-query/mutation-factory';
import { invalidateWorkspaceQueries } from '@/lib/react-query/cache-utils';

type ResponseType = InferResponseType<(typeof client.api.projects)['$post'], 200>;
type RequestType = InferRequestType<(typeof client.api.projects)['$post']>;

/**
 * Hook to create a new project
 * 
 * Uses the mutation factory for consistent error handling and cache invalidation.
 * Automatically invalidates workspace projects query.
 * 
 * @example
 * ```tsx
 * const createProject = useCreateProject();
 * createProject.mutate({ form: projectFormData });
 * ```
 */
export const useCreateProject = createMutation<ResponseType, Error, RequestType>({
  mutationFn: async ({ form }) => {
    const response = await client.api.projects['$post']({ form });

    if (!response.ok) throw new Error('Failed to create project.');

    return await response.json();
  },
  successMessage: 'Project created.',
  logPrefix: '[CREATE_PROJECT]',
  onSuccessInvalidate: (queryClient, response) => {
    // Hono responses have { data } wrapper, extract it
    const data = 'data' in response ? response.data : response;
    // Invalidate workspace projects query
    invalidateWorkspaceQueries(queryClient, data.workspaceId, {
      includeProjects: true,
      includeTasks: false,
      includeMembers: false,
      includeAnalytics: false,
    });
  },
});
