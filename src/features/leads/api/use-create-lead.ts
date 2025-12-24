import { InferRequestType, InferResponseType } from 'hono';

import { client } from '@/lib/hono';
import type { CreateLeadData } from '@/../../data/lead-schema';
import { createMutation } from '@/lib/react-query/mutation-factory';
import { invalidateLeadQueries } from '@/lib/react-query/cache-utils';

type ResponseType = InferResponseType<(typeof client.api.leads)['$post'], 201>;
type RequestType = InferRequestType<(typeof client.api.leads)['$post']>;

/**
 * Hook to create a new lead
 * 
 * Uses the mutation factory for consistent error handling and cache invalidation.
 * Automatically invalidates leads query for the workspace.
 * 
 * @example
 * ```tsx
 * const createLead = useCreateLead();
 * createLead.mutate({ 
 *   leadData: { name: 'John Doe', email: 'john@example.com' },
 *   workspaceId: 'workspace-123'
 * });
 * ```
 */
export const useCreateLead = createMutation<
  ResponseType,
  Error,
  { leadData: CreateLeadData; workspaceId: string }
>({
  mutationFn: async ({ leadData, workspaceId }) => {
    const response = await client.api.leads.$post({
      query: {
        workspaceId,
      },
      json: leadData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create lead.');
    }

    return await response.json();
  },
  successMessage: 'Lead created successfully!',
  logPrefix: '[CREATE_LEAD]',
  errorMessage: (error) => error.message || 'Failed to create lead.',
  onSuccessInvalidate: (queryClient, _data, variables) => {
    // Use centralized cache invalidation utility
    invalidateLeadQueries(queryClient, variables.workspaceId);
  },
});
