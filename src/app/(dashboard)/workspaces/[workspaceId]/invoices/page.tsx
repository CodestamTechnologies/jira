import { Suspense } from 'react';

import { PageLoader } from '@/components/page-loader';
import { InvoicePageClient } from './invoice-page-client';

export default function InvoicePage() {
  return (
    <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Invoice Generator</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
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
