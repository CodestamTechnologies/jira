import { useMutation, useQueryClient } from '@tanstack/react-query'
import { InferRequestType, InferResponseType } from 'hono'
import { toast } from 'sonner'

import { client } from '@/lib/hono'
import type { CreateLeadData } from '@/../../data/lead-schema'

type ResponseType = InferResponseType<(typeof client.api.leads)['$post'], 201>
type RequestType = InferRequestType<(typeof client.api.leads)['$post']>

export const useCreateLead = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation<ResponseType, Error, { leadData: CreateLeadData; workspaceId: string }>({
    mutationFn: async ({ leadData, workspaceId }) => {
      const response = await client.api.leads.$post({
        query: {
          workspaceId,
        },
        json: leadData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create lead.')
      }

      return await response.json()
    },
    onSuccess: ({ data }, variables) => {
      toast.success('Lead created successfully!')

      queryClient.invalidateQueries({
        queryKey: ['leads', variables.workspaceId],
        exact: false,
      })
    },
    onError: (error) => {
      console.error('[CREATE_LEAD]: ', error)
      toast.error(error.message || 'Failed to create lead.')
    },
  })

  return mutation
}


