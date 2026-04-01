import { type Models } from 'node-appwrite';

export const INVOICE_STATUS = ['paid', 'pending', 'invalid'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUS)[number];

export type Invoice = Models.Document & {
  invoiceNumber: string;
  projectId: string;
  workspaceId: string;
  status?: InvoiceStatus; // paid | pending | invalid
  environment?: string; // 'development' or 'production' - used to differentiate dev/prod invoices
  items: string | Array<{
    description: string;
    price: number;
  }>; // Stored as JSON string in Appwrite, parsed to array when reading
  notes?: string;
  subtotal: number;
  total: number;
  /** @deprecated Legacy field; invoices no longer store external payment URLs */
  paymentLinkUrl?: string;
};
