import { InferRequestType, InferResponseType } from 'hono';

import { client } from '@/lib/hono';
import { createMutation } from '@/lib/react-query/mutation-factory';
import { invalidateMemberQueries } from '@/lib/react-query/cache-utils';

type ResponseType = InferResponseType<(typeof client.api.members)[':memberId']['$patch'], 200>;
type RequestType = InferRequestType<(typeof client.api.members)[':memberId']['$patch']>;

/**
 * Hook to update an existing member
 * 
 * Uses the mutation factory for consistent error handling and cache invalidation.
 * Automatically invalidates member queries (member detail, members list).
 * 
 * @example
 * ```tsx
 * const updateMember = useUpdateMember();
 * updateMember.mutate({ 
 *   param: { memberId: 'member-123' },
 *   json: { name: 'Updated name' }
 * });
 * ```
 */
export const useUpdateMember = createMutation<ResponseType, Error, RequestType>({
  mutationFn: async ({ param, json }) => {
    const response = await client.api.members[':memberId']['$patch']({ param, json });

    if (!response.ok) throw new Error('Failed to update member.');

    return await response.json();
  },
  successMessage: 'Member updated.',
  logPrefix: '[UPDATE_MEMBER]',
  onSuccessInvalidate: (queryClient, response) => {
    // Hono responses have { data } wrapper, extract it
    const data = 'data' in response ? response.data : response;
    // Use centralized cache invalidation utility
    invalidateMemberQueries(queryClient, data.$id, data.workspaceId);
  },
});
