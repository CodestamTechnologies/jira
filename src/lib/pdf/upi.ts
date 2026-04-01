import QRCode from 'qrcode'

import { BANK_DETAILS, COMPANY_INFO } from '@/lib/pdf/constants'

export type BuildUpiPaymentUriParams = {
  payeeAddress: string
  payeeName: string
  amountRupee: number
  transactionNote: string
}

/**
 * NPCI UPI deep link (upi://pay). Encoded in QR; opens PhonePe, GPay, Paytm, etc.
 */
export const buildUpiPaymentUri = (params: BuildUpiPaymentUriParams): string => {
  const pa = params.payeeAddress.trim()
  if (!pa) return ''

  const am = params.amountRupee.toFixed(2)
  const pn = encodeURIComponent((params.payeeName || 'Payee').trim().slice(0, 99))
  const tn = encodeURIComponent(params.transactionNote.trim().slice(0, 80))

  return `upi://pay?pa=${encodeURIComponent(pa)}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`
}

const qrOptions = {
  width: 200,
  margin: 1,
  color: {
    dark: '#000000',
    light: '#FFFFFF',
  },
} as const

/**
 * PNG data URL for invoice PDF when company UPI (NEXT_PUBLIC_COMPANY_UPI) is set and amount &gt; 0.
 */
export const generateUpiInvoiceQrDataUrl = async (
  amountRupee: number,
  invoiceNumber: string,
  payeeName: string = COMPANY_INFO.legalName,
): Promise<string | undefined> => {
  const vpa = typeof BANK_DETAILS.upi === 'string' ? BANK_DETAILS.upi.trim() : ''
  if (!vpa || amountRupee <= 0) return undefined

  const uri = buildUpiPaymentUri({
    payeeAddress: vpa,
    payeeName,
    amountRupee,
    transactionNote: `Invoice ${invoiceNumber}`,
  })
  if (!uri) return undefined

  try {
    return await QRCode.toDataURL(uri, qrOptions)
  } catch (error) {
    console.error('Error generating UPI QR code:', error)
    return undefined
  }
}
