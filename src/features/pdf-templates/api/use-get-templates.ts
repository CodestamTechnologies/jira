import { useQuery } from '@tanstack/react-query'
import { InferResponseType } from 'hono'

import { client } from '@/lib/hono'
import type { PDFTemplateDocument } from '../types'

type ResponseType = InferResponseType<(typeof client.api.pdfTemplates)['$get'], 200>

interface UseGetTemplatesProps {
  workspaceId: string
  category?: string
}

export const useGetTemplates = ({ workspaceId, category }: UseGetTemplatesProps) => {
  return useQuery<ResponseType, Error>({
    queryKey: ['pdf-templates', workspaceId, category],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('workspaceId', workspaceId)
      if (category) {
        params.set('category', category)
      }

      const response = await client.api.pdfTemplates['$get']({
        query: Object.fromEntries(params),
      })

      if (!response.ok) throw new Error('Failed to fetch templates.')

      return await response.json()
    },
    enabled: !!workspaceId,
  })
}

