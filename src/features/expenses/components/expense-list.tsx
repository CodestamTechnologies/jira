'use client';

import { ExpenseTable } from './expense-table';

interface ExpenseListProps {
  projectId?: string;
}

/**
 * Expense list wrapper component
 * Provides a simple interface for displaying expenses
 */
export const ExpenseList = ({ projectId }: ExpenseListProps) => {
  return <ExpenseTable projectId={projectId} />;
};




