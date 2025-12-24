import { Suspense } from 'react';

import { PageLoader } from '@/components/page-loader';
import { CreateExpenseForm } from '@/features/expenses/components/create-expense-form';

export default function CreateExpensePage() {
  return (
    <div className="space-y-4">
      <Suspense fallback={<PageLoader />}>
        <CreateExpenseForm />
      </Suspense>
    </div>
  );
}
