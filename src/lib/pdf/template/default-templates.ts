import type { PDFTemplate } from './types'

/**
 * Default PDF templates that can be used as starting points
 */
export const DEFAULT_TEMPLATES: PDFTemplate[] = [
  {
    id: 'invoice-default',
    name: 'Standard Invoice',
    description: 'A standard invoice template with company info, client details, and items table',
    category: 'Invoice',
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sections: [
      {
        id: 'header-1',
        type: 'header',
        content: 'INVOICE\n{{companyName}}\n{{companyAddress}}',
        style: {
          fontSize: 18,
          fontWeight: 'bold',
          textAlign: 'center',
        },
      },
      {
        id: 'separator-1',
        type: 'separator',
      },
      {
        id: 'invoice-details',
        type: 'section',
        title: 'Invoice Details',
        fields: [
          {
            id: 'invoice-number',
            key: 'invoiceNumber',
            label: 'Invoice Number',
            type: 'text',
            required: true,
          },
          {
            id: 'invoice-date',
            key: 'invoiceDate',
            label: 'Invoice Date',
            type: 'date',
            required: true,
          },
        ],
      },
      {
        id: 'client-info',
        type: 'section',
        title: 'Client Information',
        fields: [
          {
            id: 'client-name',
            key: 'clientName',
            label: 'Client Name',
            type: 'text',
            required: true,
          },
          {
            id: 'client-email',
            key: 'clientEmail',
            label: 'Client Email',
            type: 'email',
          },
          {
            id: 'client-address',
            key: 'clientAddress',
            label: 'Client Address',
            type: 'textarea',
          },
        ],
      },
      {
        id: 'items-table',
        type: 'table',
        title: 'Items',
        columns: [
          {
            id: 'desc-col',
            key: 'description',
            label: 'Description',
            type: 'text',
          },
          {
            id: 'qty-col',
            key: 'quantity',
            label: 'Quantity',
            type: 'number',
          },
          {
            id: 'price-col',
            key: 'price',
            label: 'Price',
            type: 'number',
          },
          {
            id: 'total-col',
            key: 'total',
            label: 'Total',
            type: 'number',
          },
        ],
      },
      {
        id: 'summary',
        type: 'section',
        title: 'Summary',
        fields: [
          {
            id: 'subtotal',
            key: 'subtotal',
            label: 'Subtotal',
            type: 'number',
          },
          {
            id: 'tax',
            key: 'tax',
            label: 'Tax',
            type: 'number',
          },
          {
            id: 'total',
            key: 'total',
            label: 'Total',
            type: 'number',
          },
        ],
      },
      {
        id: 'separator-2',
        type: 'separator',
      },
      {
        id: 'notes',
        type: 'body',
        content: 'Notes: {{notes}}',
      },
      {
        id: 'signature',
        type: 'signature',
        title: 'Authorized Signature',
        fields: [
          {
            id: 'signer-name',
            key: 'signerName',
            label: 'Name',
            type: 'text',
          },
          {
            id: 'signer-date',
            key: 'signerDate',
            label: 'Date',
            type: 'date',
          },
        ],
      },
    ],
    fields: [
      {
        id: 'company-name',
        key: 'companyName',
        label: 'Company Name',
        type: 'text',
        defaultValue: 'Codestam Technologies',
      },
      {
        id: 'company-address',
        key: 'companyAddress',
        label: 'Company Address',
        type: 'textarea',
        defaultValue: 'Ranchi Jharkhand – 835103',
      },
      {
        id: 'notes',
        key: 'notes',
        label: 'Notes',
        type: 'textarea',
      },
    ],
  },
  {
    id: 'letter-default',
    name: 'Standard Letter',
    description: 'A simple letter template',
    category: 'Letter',
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sections: [
      {
        id: 'header-1',
        type: 'header',
        content: '{{companyName}}\n{{companyAddress}}',
      },
      {
        id: 'separator-1',
        type: 'separator',
      },
      {
        id: 'date',
        type: 'body',
        content: 'Date: {{date}}',
      },
      {
        id: 'recipient',
        type: 'body',
        content: 'To,\n{{recipientName}}\n{{recipientAddress}}',
      },
      {
        id: 'subject',
        type: 'body',
        content: 'Subject: {{subject}}',
        style: {
          fontWeight: 'bold',
        },
      },
      {
        id: 'body',
        type: 'body',
        content: '{{bodyContent}}',
      },
      {
        id: 'signature',
        type: 'signature',
        title: 'Signature',
        fields: [
          {
            id: 'signer-name',
            key: 'signerName',
            label: 'Name',
            type: 'text',
          },
        ],
      },
    ],
    fields: [
      {
        id: 'company-name',
        key: 'companyName',
        label: 'Company Name',
        type: 'text',
        defaultValue: 'Codestam Technologies',
      },
      {
        id: 'company-address',
        key: 'companyAddress',
        label: 'Company Address',
        type: 'textarea',
        defaultValue: 'Ranchi Jharkhand – 835103',
      },
      {
        id: 'date',
        key: 'date',
        label: 'Date',
        type: 'date',
      },
      {
        id: 'recipient-name',
        key: 'recipientName',
        label: 'Recipient Name',
        type: 'text',
      },
      {
        id: 'recipient-address',
        key: 'recipientAddress',
        label: 'Recipient Address',
        type: 'textarea',
      },
      {
        id: 'subject',
        key: 'subject',
        label: 'Subject',
        type: 'text',
      },
      {
        id: 'body-content',
        key: 'bodyContent',
        label: 'Body Content',
        type: 'textarea',
      },
      {
        id: 'signer-name',
        key: 'signerName',
        label: 'Signer Name',
        type: 'text',
      },
    ],
  },
]



