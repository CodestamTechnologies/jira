import { useMutation, useQueryClient } from '@tanstack/react-query'
import { InferResponseType } from 'hono'
import { toast } from 'sonner'

import { client } from '@/lib/hono'
import type { PDFTemplateDocument } from '../types'

type ResponseType = InferResponseType<(typeof client.api.pdfTemplates)[':id']['$delete'], 200>

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation<ResponseType, Error, { id: string; workspaceId: string }>({
    mutationFn: async ({ id }) => {
      const response = await client.api.pdfTemplates[':id']['$delete']({
        param: { id },
      })

      if (!response.ok) throw new Error('Failed to delete template.')

      return await response.json()
    },
    onSuccess: (_, variables) => {
      toast.success('Template deleted successfully.')

      queryClient.invalidateQueries({
        queryKey: ['pdf-templates', variables.workspaceId],
      })
    },
    onError: (error) => {
      console.error('[DELETE_PDF_TEMPLATE]: ', error)
      toast.error('Failed to delete template.')
    },
  })

  return mutation
}

