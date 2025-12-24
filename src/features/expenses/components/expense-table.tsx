'use client';

import { useState, useMemo, useCallback } from 'react';
import { Loader2, Receipt } from 'lucide-react';

import { DataTable } from '@/features/tasks/components/data-table';
import { Card, CardContent } from '@/components/ui/card';
import { useGetExpenses } from '../api/use-get-expenses';
import { useGetProjects } from '@/features/projects/api/use-get-projects';
import { createExpenseColumns } from './expense-columns';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useDeleteExpense } from '../api/use-delete-expense';
import { toast } from 'sonner';
import type { Expense } from '../types';
import type { ExpenseFiltersInput } from '../schema';
import { ExpenseFilters } from './expense-filters';
import { ExpenseStats } from './expense-stats';
import { ExpenseExport } from './expense-export';

interface ExpenseTableProps {
  projectId?: string;
}

interface ExpenseWithProject extends Expense {
  projectName?: string;
}

/**
 * Main expense table component
 * Displays expenses in a sortable, filterable table
 */
export const ExpenseTable = ({ projectId }: ExpenseTableProps) => {
  const workspaceId = useWorkspaceId();
  const [filters, setFilters] = useState<ExpenseFiltersInput>({
    workspaceId,
    projectId,
    startDate: undefined,
    endDate: undefined,
    category: undefined,
    status: undefined,
  });

  const { data: expensesData, isLoading: isLoadingExpenses } = useGetExpenses(filters);
  const { data: projectsData } = useGetProjects({ workspaceId });
  const { mutate: deleteExpense, isPending: isDeleting } = useDeleteExpense();
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  // Create a map of project IDs to project names for quick lookup
  // Single source of truth - used for both display and export (DRY principle)
  const projectMap = useMemo(() => {
    if (!projectsData?.documents) return new Map();
    return new Map(projectsData.documents.map((project) => [project.$id, project.name]));
  }, [projectsData]);

  // Create project objects map for export component (only if needed)
  const projectsMapForExport = useMemo(() => {
    if (!projectsData?.documents) return new Map();
    return new Map(projectsData.documents.map((project) => [project.$id, project]));
  }, [projectsData]);

  const expenses = expensesData?.documents || [];
  const isLoading = isLoadingExpenses;

  // Enrich expenses with project names
  const expensesWithProjects: ExpenseWithProject[] = useMemo(() => {
    return expenses.map((expense) => ({
      ...expense,
      projectName: projectMap.get(expense.projectId || ''),
    }));
  }, [expenses, projectMap]);

  const handleDelete = useCallback(
    (expense: Expense) => {
      if (!confirm(`Are you sure you want to delete this expense: ${expense.description}?`)) {
        return;
      }

      setDeletingExpenseId(expense.$id);
      deleteExpense(
        {
          param: { expenseId: expense.$id },
        },
        {
          onSuccess: () => {
            toast.success('Expense deleted successfully');
            setDeletingExpenseId(null);
          },
          onError: (error) => {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete expense.';
            toast.error(errorMessage);
            setDeletingExpenseId(null);
          },
        },
      );
    },
    [deleteExpense],
  );

  const columns = useMemo(
    () =>
      createExpenseColumns({
        projectMap,
        onDelete: handleDelete,
        deletingExpenseId,
      }),
    [projectMap, handleDelete, deletingExpenseId],
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="space-y-4">
        <ExpenseStats expenses={expenses} />
        <ExpenseFilters filters={filters} onFiltersChange={setFilters} projects={projectsData?.documents || []} />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="size-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground text-center">
              No expenses found. Create your first expense to get started.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <ExpenseStats expenses={expenses} />
        {expenses.length > 0 && (
          <ExpenseExport expenses={expenses} projectMap={projectsMapForExport} />
        )}
      </div>
      <ExpenseFilters filters={filters} onFiltersChange={setFilters} projects={projectsData?.documents || []} />
      <DataTable columns={columns} data={expensesWithProjects} total={expensesData?.total || 0} />
    </div>
  );
};
