'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatAmount } from '../utils/format-amount';
import type { Expense } from '../types';
import { ExpenseCategory } from '../types';
import { formatCategoryForDisplay } from '../utils/expense-helpers';

interface ExpenseStatsProps {
  expenses: Expense[];
}

/**
 * Expense statistics component
 * Displays total amount and breakdown by category
 */
export const ExpenseStats = ({ expenses }: ExpenseStatsProps) => {
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const categoryTotals = expenses.reduce((acc, expense) => {
    const category = expense.category || ExpenseCategory.OTHER;
    acc[category] = (acc[category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatAmount(totalAmount)}</div>
          <p className="text-xs text-muted-foreground">{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</p>
        </CardContent>
      </Card>

      {topCategories.map(([category, amount], index) => (
        <Card key={category}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {formatCategoryForDisplay(category)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(amount)}</div>
            <p className="text-xs text-muted-foreground">
              {((amount / totalAmount) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
