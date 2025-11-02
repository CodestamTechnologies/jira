import { useMutation } from '@tanstack/react-query'

import { client } from '@/lib/hono'

type SendSalarySlipRequest = {
  employeeName: string
  employeeEmail: string
  month: string
  year: string
  pdfBase64: string
}

type SendSalarySlipResponse = {
  success: boolean
  message: string
  emailId?: string
}

export const useSendSalarySlip = () => {
  return useMutation({
    mutationFn: async (data: SendSalarySlipRequest): Promise<SendSalarySlipResponse> => {
      const response = await client.api['salary-slip'].send.$post({ json: data })

      if (!response.ok) {
        const error = await response.json() as { error?: string }
        throw new Error(error.error || 'Failed to send salary slip')
      }

      const result = await response.json()
      return (result as { data?: SendSalarySlipResponse }).data || (result as SendSalarySlipResponse)
    },
  })
}
