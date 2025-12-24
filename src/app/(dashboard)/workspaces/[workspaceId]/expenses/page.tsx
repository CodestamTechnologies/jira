import { Suspense } from 'react';

import { PageLoader } from '@/components/page-loader';
import { ExpensesPageClient } from './expenses-page-client';

export default function ExpensesPage() {
  return (
    <div className="space-y-4">
      <Suspense fallback={<PageLoader />}>
        <ExpensesPageClient />
      </Suspense>
    </div>
  );
}
