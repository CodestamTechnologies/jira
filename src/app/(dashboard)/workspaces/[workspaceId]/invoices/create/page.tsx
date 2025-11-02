import { Suspense } from 'react';

import { PageLoader } from '@/components/page-loader';
import { InvoiceCreatePageClient } from './invoice-create-page-client';

export default function InvoiceCreatePage() {
  return (
    <div className="space-y-4">
      <Suspense fallback={<PageLoader />}>
        <InvoiceCreatePageClient />
      </Suspense>
    </div>
  );
}
