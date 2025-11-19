import { useMutation, useQueryClient } from '@tanstack/react-query'

interface BulkLeadData {
  name: string
  email?: string
  phone?: string
  company?: string
  website?: string
  source?: string
  status?: string
  priority?: string
  description?: string
  notes?: string
  assigneeEmails?: string[] // Emails that will be converted to member IDs
}

interface BulkCreateLeadsResponse {
  data: {
    success: number
    failed: number
    errors: string[]
  }
}

export const useBulkCreateLeads = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation<BulkCreateLeadsResponse, Error, { leads: BulkLeadData[]; workspaceId: string }>({
    mutationFn: async ({ leads, workspaceId }) => {
      // Use fetch directly since Hono client typing might not include bulk endpoint
      const response = await fetch(`/api/leads/bulk?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ leads }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to upload leads.' }))
        throw new Error(error.error || 'Failed to upload leads.')
      }

      const data = await response.json()
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['leads', variables.workspaceId],
        exact: false,
      })
    },
    onError: (error) => {
      console.error('[BULK_CREATE_LEADS]: ', error)
    },
  })

  return mutation
}

