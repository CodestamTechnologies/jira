import { InferRequestType, InferResponseType } from 'hono'

import { client } from '@/lib/hono'
import { createMutation } from '@/lib/react-query/mutation-factory'
import { invalidateMemberQueries } from '@/lib/react-query/cache-utils'

type ResponseType = InferResponseType<(typeof client.api.members)[':memberId']['invoices-access']['$patch'], 200>
type RequestType = InferRequestType<(typeof client.api.members)[':memberId']['invoices-access']['$patch']>

/**
 * Hook to update a member's invoices access permission
 * 
 * Uses the mutation factory for consistent error handling and cache invalidation.
 * Automatically invalidates member queries and feature access queries.
 * 
 * @example
 * ```tsx
 * const updateInvoicesAccess = useUpdateInvoicesAccess();
 * updateInvoicesAccess.mutate({ 
 *   param: { memberId: 'member-123' },
 *   json: { hasInvoicesAccess: true }
 * });
 * ```
 */
export const useUpdateInvoicesAccess = createMutation<ResponseType, Error, RequestType>({
  mutationFn: async ({ param, json }) => {
    const response = await client.api.members[':memberId']['invoices-access']['$patch']({ param, json })

    if (!response.ok) throw new Error('Failed to update invoices access.')

    return await response.json()
  },
  successMessage: 'Invoices access updated.',
  logPrefix: '[UPDATE_INVOICES_ACCESS]',
  onSuccessInvalidate: (queryClient, response) => {
    // Hono responses have { data } wrapper, extract it
    const data = 'data' in response ? response.data : response
    // Invalidate member queries (this already invalidates feature access queries via cache-utils)
    invalidateMemberQueries(queryClient, data.$id, data.workspaceId)
  },
})
