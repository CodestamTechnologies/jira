import { type Models } from 'node-appwrite';

export type Invoice = Models.Document & {
  invoiceNumber: string;
  projectId: string;
  workspaceId: string;
  environment?: string; // 'development' or 'production' - used to differentiate dev/prod invoices
  items: string | Array<{
    description: string;
    price: number;
  }>; // Stored as JSON string in Appwrite, parsed to array when reading
  notes?: string;
  subtotal: number;
  total: number;
  paymentLinkUrl?: string; // Razorpay payment link URL
};
