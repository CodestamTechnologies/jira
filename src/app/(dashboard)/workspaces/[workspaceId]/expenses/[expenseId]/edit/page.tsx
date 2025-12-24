import { Suspense } from 'react';
import { notFound } from 'next/navigation';

import { PageLoader } from '@/components/page-loader';
import { EditExpenseForm } from '@/features/expenses/components/edit-expense-form';

interface EditExpensePageProps {
  params: {
    expenseId: string;
  };
}

export default function EditExpensePage({ params }: EditExpensePageProps) {
  if (!params.expenseId) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <Suspense fallback={<PageLoader />}>
        <EditExpenseForm expenseId={params.expenseId} />
      </Suspense>
    </div>
  );
}
