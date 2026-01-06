'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { pdf } from '@react-pdf/renderer'
import QRCode from 'qrcode'

import InvoicePDF, { type InvoiceData } from '@/components/invoice-pdf'
import { COMPANY_INFO, BANK_DETAILS, TERMS_AND_CONDITIONS } from '@/lib/pdf/constants'
import { generateSafeFilename, pdfBlobToBase64 } from '@/lib/pdf/utils'
import { useDownloadWithLogging } from '@/lib/pdf/use-download-with-logging'
import type { Invoice } from '@/features/invoices/types'
import type { Project } from '@/features/projects/types'

interface UseDownloadInvoiceProps {
  invoice: Invoice
  project?: Project | null
}

export const useDownloadInvoice = () => {
  const [isDownloading, setIsDownloading] = useState(false)
  const { downloadWithLogging } = useDownloadWithLogging()

  const generateInvoicePDF = async ({ invoice, project }: UseDownloadInvoiceProps) => {
    if (!project) {
      throw new Error('Project information not found. Cannot generate invoice.')
    }

    try {
      // Parse items from invoice (they might be stored as string or array)
      const invoiceItems = Array.isArray(invoice.items)
        ? invoice.items
        : typeof invoice.items === 'string'
          ? JSON.parse(invoice.items)
          : []

      // Format items with IDs for the PDF component
      const formattedItems = invoiceItems.map((item: { description: string; price: number }, index: number) => ({
        id: `item-${index}`,
        description: item.description || '',
        price: item.price || 0,
      }))

      // Calculate tax (0% for now)
      const taxRate = 0
      const taxAmount = 0

      // Format invoice date
      const invoiceDate = invoice.$createdAt
        ? format(new Date(invoice.$createdAt), 'MMM dd, yyyy')
        : format(new Date(), 'MMM dd, yyyy')

      // Generate QR code for payment link if available
      let qrCodeDataUrl: string | undefined
      if (invoice.paymentLinkUrl) {
        try {
          qrCodeDataUrl = await QRCode.toDataURL(invoice.paymentLinkUrl, {
            width: 200,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          })
        } catch (error) {
          console.error('Error generating QR code:', error)
          // Continue without QR code if generation fails
        }
      } else {
        console.log('No payment link URL found for invoice:', invoice.invoiceNumber)
      }

      // Prepare invoice data
      const invoiceData: InvoiceData = {
        // Company Information - Use legalName to match invoice-generator behavior
        companyName: COMPANY_INFO.legalName,
        companyAddress: COMPANY_INFO.address,
        companyEmail: COMPANY_INFO.email,
        companyPhone: COMPANY_INFO.phone,
        companyWebsite: COMPANY_INFO.website,
        logoUrl: COMPANY_INFO.logoUrl,
        udyamRegistrationNumber: COMPANY_INFO.udyamRegistrationNumber,

        // Invoice Information
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate,

        // Client Information
        clientName: project.name || 'N/A',
        clientEmail: project.clientEmail || 'N/A',
        clientAddress: project.clientAddress || 'N/A',
        clientPhone: project.clientPhone || undefined,

        // Items
        items: formattedItems,

        // Summary
        subtotal: invoice.subtotal,
        taxRate,
        taxAmount,
        total: invoice.total,

        // Notes and Terms
        notes: invoice.notes || undefined,
        termsAndConditions: TERMS_AND_CONDITIONS,

        // Payment Link
        paymentLinkUrl: invoice.paymentLinkUrl || undefined,
        paymentLinkQrCode: qrCodeDataUrl,

        // Bank Details
        bankName: BANK_DETAILS.bankName,
        accountName: BANK_DETAILS.accountName,
        accountNumber: BANK_DETAILS.accountNumber,
        ifsc: BANK_DETAILS.ifsc,
        branch: BANK_DETAILS.branch,
        upi: BANK_DETAILS.upi || '',
      }

      // Generate PDF
      const doc = <InvoicePDF {...invoiceData} />
      const pdfBlob = await pdf(doc).toBlob()

      return { pdfBlob, invoiceData }
    } catch (error) {
      console.error('Error generating invoice PDF:', error)
      throw error
    }
  }

  const downloadInvoice = async ({ invoice, project }: UseDownloadInvoiceProps) => {
    setIsDownloading(true)

    try {
      const { pdfBlob } = await generateInvoicePDF({ invoice, project })

      // Download PDF with logging
      const filename = generateSafeFilename(`invoice-${invoice.invoiceNumber.replace(/\//g, '-')}`, 'pdf')
      await downloadWithLogging({
        documentType: 'INVOICE',
        blob: pdfBlob,
        filename,
        documentName: `invoice-${invoice.invoiceNumber}`,
        invoiceNumber: invoice.invoiceNumber,
        workspaceId: invoice.workspaceId,
      })
    } catch (error) {
      console.error('Error downloading invoice:', error)
      throw error
    } finally {
      setIsDownloading(false)
    }
  }

  return { downloadInvoice, generateInvoicePDF, isDownloading }
}
