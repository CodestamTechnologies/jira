import { useMutation, useQueryClient } from '@tanstack/react-query'
import { InferResponseType } from 'hono'
import { toast } from 'sonner'

import { client } from '@/lib/hono'

type ResponseType = InferResponseType<(typeof client.api.leads)[':leadId']['$delete'], 200>

export const useDeleteLead = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation<ResponseType, Error, { leadId: string; workspaceId: string }>({
    mutationFn: async ({ leadId }) => {
      const response = await client.api.leads[':leadId'].$delete({
        param: { leadId },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error((errorData as any)?.error || 'Failed to delete lead.')
      }

      return await response.json()
    },
    onSuccess: (_, variables) => {
      toast.success('Lead deleted successfully!')

      queryClient.invalidateQueries({
        queryKey: ['leads', variables.workspaceId],
        exact: false,
      })
    },
    onError: (error) => {
      console.error('[DELETE_LEAD]: ', error)
      toast.error(error.message || 'Failed to delete lead.')
    },
  })

  return mutation
}

