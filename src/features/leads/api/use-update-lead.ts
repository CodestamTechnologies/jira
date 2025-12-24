import { InferRequestType, InferResponseType } from 'hono';

import { client } from '@/lib/hono';
import type { UpdateLeadData } from '@/../../data/lead-schema';
import { createMutation } from '@/lib/react-query/mutation-factory';
import { invalidateLeadQueries } from '@/lib/react-query/cache-utils';

type ResponseType = InferResponseType<(typeof client.api.leads)[':leadId']['$put'], 200>;
type RequestType = InferRequestType<(typeof client.api.leads)[':leadId']['$put']>;

/**
 * Hook to update an existing lead
 * 
 * Uses the mutation factory for consistent error handling and cache invalidation.
 * Automatically invalidates leads query for the workspace.
 * 
 * @example
 * ```tsx
 * const updateLead = useUpdateLead();
 * updateLead.mutate({
 *   leadId: 'lead-123',
 *   updateData: { name: 'Updated name' },
 *   workspaceId: 'workspace-123'
 * });
 * ```
 */
export const useUpdateLead = createMutation<
  ResponseType,
  Error,
  { leadId: string; updateData: UpdateLeadData; workspaceId: string }
>({
  mutationFn: async ({ leadId, updateData }) => {
    const response = await client.api.leads[':leadId'].$put({
      param: { leadId },
      json: updateData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as any)?.error || 'Failed to update lead.');
    }

    return await response.json();
  },
  successMessage: 'Lead updated successfully!',
  logPrefix: '[UPDATE_LEAD]',
  errorMessage: (error) => error.message || 'Failed to update lead.',
  onSuccessInvalidate: (queryClient, _data, variables) => {
    // Use centralized cache invalidation utility
    invalidateLeadQueries(queryClient, variables.workspaceId, variables.leadId);
  },
});
