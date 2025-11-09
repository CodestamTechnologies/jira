import { useMutation, useQueryClient } from '@tanstack/react-query'
import { InferRequestType, InferResponseType } from 'hono'
import { toast } from 'sonner'

import { client } from '@/lib/hono'
import type { PDFTemplateDocument } from '../types'

type ResponseType = InferResponseType<(typeof client.api.pdfTemplates)[':id']['$patch'], 200>
type RequestType = InferRequestType<(typeof client.api.pdfTemplates)[':id']['$patch']>

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation<ResponseType, Error, { id: string; data: RequestType['json'] }>({
    mutationFn: async ({ id, data }) => {
      const response = await client.api.pdfTemplates[':id']['$patch']({
        param: { id },
        json: data,
      })

      if (!response.ok) throw new Error('Failed to update template.')

      return await response.json()
    },
    onSuccess: (response) => {
      toast.success('Template updated successfully.')

      const template = response.data as PDFTemplateDocument

      queryClient.invalidateQueries({
        queryKey: ['pdf-templates', template.workspaceId],
      })
    },
    onError: (error) => {
      console.error('[UPDATE_PDF_TEMPLATE]: ', error)
      toast.error('Failed to update template.')
    },
  })

  return mutation
}

