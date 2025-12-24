import { useMutation, useQueryClient } from '@tanstack/react-query'
import { InferRequestType, InferResponseType } from 'hono'
import { toast } from 'sonner'

import { client } from '@/lib/hono'
import type { CreateCommentData } from '@/../../data/lead-schema'

type ResponseType = InferResponseType<(typeof client.api.leads)[':leadId']['comments']['$post'], 201>
type RequestType = InferRequestType<(typeof client.api.leads)[':leadId']['comments']['$post']>

export const useAddComment = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation<ResponseType, Error, { leadId: string; commentData: CreateCommentData; workspaceId: string }>({
    mutationFn: async ({ leadId, commentData }) => {
      const response = await client.api.leads[':leadId'].comments.$post({
        param: { leadId },
        json: commentData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add comment.')
      }

      return await response.json()
    },
    onSuccess: (_, variables) => {
      toast.success('Comment added successfully!')

      queryClient.invalidateQueries({
        queryKey: ['leads', variables.workspaceId],
        exact: false,
      })
      queryClient.invalidateQueries({
        queryKey: ['lead', variables.leadId],
        exact: false,
      })
    },
    onError: (error) => {
      console.error('[ADD_COMMENT]: ', error)
      toast.error(error.message || 'Failed to add comment.')
    },
  })

  return mutation
}
