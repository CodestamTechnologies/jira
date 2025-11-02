'use client';

import { InvoiceTable } from '@/features/invoices/components/invoice-table';

interface InvoiceListProps {
  projectId?: string;
}

export const InvoiceList = ({ projectId }: InvoiceListProps) => {
  return <InvoiceTable projectId={projectId} />;
};
