import { InferResponseType } from 'hono';

import { client } from '@/lib/hono';
import { createMutation } from '@/lib/react-query/mutation-factory';
import { invalidateLeadQueries } from '@/lib/react-query/cache-utils';

type ResponseType = InferResponseType<(typeof client.api.leads)[':leadId']['$delete'], 200>;

/**
 * Hook to delete a lead
 * 
 * Uses the mutation factory for consistent error handling and cache invalidation.
 * Automatically invalidates leads query for the workspace.
 * 
 * @example
 * ```tsx
 * const deleteLead = useDeleteLead();
 * deleteLead.mutate({
 *   leadId: 'lead-123',
 *   workspaceId: 'workspace-123'
 * });
 * ```
 */
export const useDeleteLead = createMutation<
  ResponseType,
  Error,
  { leadId: string; workspaceId: string }
>({
  mutationFn: async ({ leadId }) => {
    const response = await client.api.leads[':leadId'].$delete({
      param: { leadId },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as any)?.error || 'Failed to delete lead.');
    }

    return await response.json();
  },
  successMessage: 'Lead deleted successfully!',
  logPrefix: '[DELETE_LEAD]',
  errorMessage: (error) => error.message || 'Failed to delete lead.',
  onSuccessInvalidate: (queryClient, _data, variables) => {
    // Use centralized cache invalidation utility
    invalidateLeadQueries(queryClient, variables.workspaceId);
  },
});
