import { useMutation, useQueryClient } from '@tanstack/react-query'
import { InferRequestType, InferResponseType } from 'hono'
import { toast } from 'sonner'

import { client } from '@/lib/hono'
import type { PDFTemplateDocument } from '../types'

type ResponseType = InferResponseType<(typeof client.api)['pdf-templates']['$post'], 200>
type RequestType = InferRequestType<(typeof client.api)['pdf-templates']['$post']>

export const useCreateTemplate = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api['pdf-templates']['$post']({ json })

      if (!response.ok) throw new Error('Failed to create template.')

      return await response.json()
    },
    onSuccess: (response) => {
      toast.success('Template saved successfully.')

      const template = response.data as PDFTemplateDocument

      queryClient.invalidateQueries({
        queryKey: ['pdf-templates', template.workspaceId],
      })
    },
    onError: (error) => {
      console.error('[CREATE_PDF_TEMPLATE]: ', error)
      toast.error('Failed to save template.')
    },
  })

  return mutation
}

