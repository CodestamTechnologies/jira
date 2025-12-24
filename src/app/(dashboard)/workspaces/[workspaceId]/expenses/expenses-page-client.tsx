'use client';

import Link from 'next/link';
import { useHasExpensesAccess } from '@/features/members/hooks/use-has-expenses-access';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpenseList } from '@/features/expenses/components/expense-list';
import { Plus, AlertCircle } from 'lucide-react';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';

/**
 * Expenses page client component
 * Main page for viewing and managing expenses
 */
export function ExpensesPageClient() {
  const workspaceId = useWorkspaceId();
  const { data: hasAccess, isLoading } = useHasExpensesAccess();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="size-5 text-destructive" />
            Access Denied
          </CardTitle>
          <CardDescription>
            You do not have permission to access this page. Please contact an administrator to grant you expenses access.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button asChild size={'sm'}>
          <Link href={`/workspaces/${workspaceId}/expenses/create`}>
            <Plus className="mr-2 size-4" />
            Create New Expense
          </Link>
        </Button>
      </div>

      <ExpenseList />
    </div>
  );
}
