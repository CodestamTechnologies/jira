import { InferRequestType, InferResponseType } from 'hono'

import { client } from '@/lib/hono'
import { createMutation } from '@/lib/react-query/mutation-factory'
import { invalidateMemberQueries } from '@/lib/react-query/cache-utils'

type ResponseType = InferResponseType<(typeof client.api.members)[':memberId']['activity-logs-access']['$patch'], 200>
type RequestType = InferRequestType<(typeof client.api.members)[':memberId']['activity-logs-access']['$patch']>

/**
 * Hook to update a member's activity logs access permission
 * 
 * Uses the mutation factory for consistent error handling and cache invalidation.
 * Automatically invalidates member queries and feature access queries.
 * 
 * @example
 * ```tsx
 * const updateActivityLogsAccess = useUpdateActivityLogsAccess();
 * updateActivityLogsAccess.mutate({ 
 *   param: { memberId: 'member-123' },
 *   json: { hasActivityLogsAccess: true }
 * });
 * ```
 */
export const useUpdateActivityLogsAccess = createMutation<ResponseType, Error, RequestType>({
  mutationFn: async ({ param, json }) => {
    const response = await client.api.members[':memberId']['activity-logs-access']['$patch']({ param, json })

    if (!response.ok) throw new Error('Failed to update activity logs access.')

    return await response.json()
  },
  successMessage: 'Activity logs access updated.',
  logPrefix: '[UPDATE_ACTIVITY_LOGS_ACCESS]',
  onSuccessInvalidate: (queryClient, response) => {
    // Hono responses have { data } wrapper, extract it
    const data = 'data' in response ? response.data : response
    // Invalidate member queries (this already invalidates feature access queries via cache-utils)
    invalidateMemberQueries(queryClient, data.$id, data.workspaceId)
  },
})
