import { Suspense } from 'react';

import { PageLoader } from '@/components/page-loader';
import { InvoicePageClient } from './invoice-page-client';

export default function InvoicePage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Generator</h1>
          <p className="text-muted-foreground">
            Create and download professional invoices for your clients
          </p>
        </div>
      </div>

      <Suspense fallback={<PageLoader />}>
        <InvoicePageClient />
      </Suspense>
    </div>
  );
}
