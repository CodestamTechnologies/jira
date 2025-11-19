import { useMutation, useQueryClient } from '@tanstack/react-query'
import { InferRequestType, InferResponseType } from 'hono'
import { toast } from 'sonner'

import { client } from '@/lib/hono'
import type { UpdateLeadData } from '@/../../data/lead-schema'

type ResponseType = InferResponseType<(typeof client.api.leads)[':leadId']['$put'], 200>
type RequestType = InferRequestType<(typeof client.api.leads)[':leadId']['$put']>

export const useUpdateLead = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation<ResponseType, Error, { leadId: string; updateData: UpdateLeadData; workspaceId: string }>({
    mutationFn: async ({ leadId, updateData }) => {
      const response = await client.api.leads[':leadId'].$put({
        param: { leadId },
        json: updateData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error((errorData as any)?.error || 'Failed to update lead.')
      }

      return await response.json()
    },
    onSuccess: (_, variables) => {
      toast.success('Lead updated successfully!')

      queryClient.invalidateQueries({
        queryKey: ['leads', variables.workspaceId],
        exact: false,
      })
    },
    onError: (error) => {
      console.error('[UPDATE_LEAD]: ', error)
      toast.error(error.message || 'Failed to update lead.')
    },
  })

  return mutation
}

