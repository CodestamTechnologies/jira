import { useMutation } from '@tanstack/react-query'
import { InferRequestType, InferResponseType } from 'hono'
import { toast } from 'sonner'

import { client } from '@/lib/hono'
import type { PaymentLinkResponse } from '../types'

type ResponseType = InferResponseType<(typeof client.api.payments)['create-link']['$post'], 200>
type RequestType = InferRequestType<(typeof client.api.payments)['create-link']['$post']>

export const useCreatePaymentLink = () => {
  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.payments['create-link']['$post']({ json })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create payment link.')
      }

      return await response.json()
    },
    onSuccess: (response) => {
      const paymentLink = response.data as PaymentLinkResponse
      toast.success('Payment link created successfully!')
    },
    onError: (error) => {
      console.error('[CREATE_PAYMENT_LINK]: ', error)
      toast.error(error.message || 'Failed to create payment link.')
    },
  })

  return mutation
}
