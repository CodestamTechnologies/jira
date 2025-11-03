import { useMutation } from '@tanstack/react-query'

import { client } from '@/lib/hono'

type SendInvoiceRequest = {
  invoiceNumber: string
  clientName: string
  clientEmail: string
  pdfBase64: string
}

type SendInvoiceResponse = {
  success: boolean
  message: string
  emailId?: string
}

export const useSendInvoice = () => {
  return useMutation({
    mutationFn: async (data: SendInvoiceRequest): Promise<SendInvoiceResponse> => {
      const response = await client.api.invoices.send.$post({ json: data })

      if (!response.ok) {
        const error = (await response.json()) as { error?: string }
        throw new Error(error.error || 'Failed to send invoice')
      }

      const result = await response.json()
      return (result as { data?: SendInvoiceResponse }).data || (result as SendInvoiceResponse)
    },
  })
}
