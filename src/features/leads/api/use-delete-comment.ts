import { useMutation, useQueryClient } from '@tanstack/react-query'
import { InferResponseType } from 'hono'
import { toast } from 'sonner'

import { client } from '@/lib/hono'

type ResponseType = InferResponseType<(typeof client.api.leads)[':leadId']['comments'][':commentId']['$delete'], 200>

export const useDeleteComment = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation<ResponseType, Error, { leadId: string; commentId: string; workspaceId: string }>({
    mutationFn: async ({ leadId, commentId }) => {
      const response = await client.api.leads[':leadId'].comments[':commentId'].$delete({
        param: { leadId, commentId },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error((errorData as any)?.error || 'Failed to delete comment.')
      }

      return await response.json()
    },
    onSuccess: (_, variables) => {
      toast.success('Comment deleted successfully!')

      queryClient.invalidateQueries({
        queryKey: ['leads', variables.workspaceId],
        exact: false,
      })
    },
    onError: (error) => {
      console.error('[DELETE_COMMENT]: ', error)
      toast.error(error.message || 'Failed to delete comment.')
    },
  })

  return mutation
}

