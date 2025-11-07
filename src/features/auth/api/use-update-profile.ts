import { useMutation, useQueryClient } from '@tanstack/react-query'
import { InferRequestType, InferResponseType } from 'hono'

import { client } from '@/lib/hono'

type ResponseType = InferResponseType<(typeof client.api.auth)['profile']['$patch']>
type RequestType = InferRequestType<(typeof client.api.auth)['profile']['$patch']>

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ form }) => {
      const response = await client.api.auth.profile.$patch({ form })

      if (!response.ok) {
        const error = await response.json() as { error?: string }
        throw new Error(error.error || 'Failed to update profile')
      }

      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current'] })
    },
  })
}
