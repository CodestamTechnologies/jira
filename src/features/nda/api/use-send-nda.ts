import { useMutation } from '@tanstack/react-query'

import { client } from '@/lib/hono'

type SendNDARequest = {
  employeeName: string
  employeeEmail: string
  employeeAddress: string
  employeeAadhar: string
  effectiveDate: string
  pdfBase64: string
  workspaceId: string
}

type SendNDAResponse = {
  success: boolean
  message: string
  emailId?: string
}

export const useSendNDA = () => {
  return useMutation({
    mutationFn: async (data: SendNDARequest): Promise<SendNDAResponse> => {
      const response = await client.api.nda.send.$post({ json: data })

      if (!response.ok) {
        const error = await response.json() as { error?: string }
        throw new Error(error.error || 'Failed to send NDA')
      }

      const result = await response.json()
      return (result as { data?: SendNDAResponse }).data || (result as SendNDAResponse)
    },
  })
}
