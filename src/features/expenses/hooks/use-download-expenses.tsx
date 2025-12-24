'use client';

import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';

import { useDownloadWithLogging } from '@/lib/pdf/use-download-with-logging';
import { generateSafeFilename } from '@/lib/pdf/utils';
import { exportToCSV, exportToJSON } from '@/utils/export-utils';
import type { Expense } from '../types';
import { formatAmount } from '../utils/format-amount';
import { getCategoryName } from '../utils/expense-helpers';
import { ExpensePDF } from '../components/expense-pdf';

interface UseDownloadExpensesProps {
  expenses: Expense[];
  projectMap?: Map<string, string>;
}

/**
 * Hook for downloading expenses in various formats (PDF, CSV)
 * Automatically logs downloads to activity logs
 */
export const useDownloadExpenses = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { downloadWithLogging } = useDownloadWithLogging();

  /**
   * Export expenses to CSV format
   * Uses centralized CSV export utility (DRY principle)
   */
  const exportExpensesToCSV = useCallback(
    ({ expenses, projectMap }: UseDownloadExpensesProps) => {
      if (expenses.length === 0) {
        toast.error('No expenses to export');
        return;
      }

      const headers = ['Date', 'Description', 'Category', 'Amount', 'Project', 'Status', 'Notes'];
      
      exportToCSV(
        expenses,
        headers,
        (expense) => {
          const projectName = projectMap?.get(expense.projectId || '') || 'Workspace';
          return [
            format(new Date(expense.date), 'yyyy-MM-dd'),
            expense.description,
            getCategoryName(expense.category, expense.customCategory),
            formatAmount(expense.amount, false).replace(/[₹,]/g, '').trim(),
            projectName,
            expense.status,
            expense.notes || '',
          ];
        },
        `expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      );

      toast.success('Expenses exported to CSV');
    },
    [],
  );

  /**
   * Export expenses to PDF format
   */
  const exportToPDF = useCallback(
    async ({ expenses, projectMap }: UseDownloadExpensesProps) => {
      if (expenses.length === 0) {
        toast.error('No expenses to export');
        return;
      }

      setIsDownloading(true);
      try {
        const pdfDoc = <ExpensePDF expenses={expenses} projectMap={projectMap} />;
        const blob = await pdf(pdfDoc).toBlob();
        const filename = generateSafeFilename(`expenses-${format(new Date(), 'yyyy-MM-dd')}`, 'pdf');

        // Download with logging
        await downloadWithLogging({
          documentType: 'EXPENSE',
          blob,
          filename,
          documentName: `expenses-${format(new Date(), 'yyyy-MM-dd')}`,
          workspaceId: expenses[0]?.workspaceId,
        });

        toast.success('Expenses exported to PDF');
      } catch (error) {
        // Log error for debugging but provide user-friendly message
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[EXPORT_EXPENSES_PDF]:', errorMessage);
        toast.error('Failed to export expenses to PDF. Please try again.');
      } finally {
        setIsDownloading(false);
      }
    },
    [downloadWithLogging],
  );

  /**
   * Export expenses to JSON format
   * Uses centralized JSON export utility (DRY principle)
   */
  const exportExpensesToJSON = useCallback(({ expenses }: UseDownloadExpensesProps) => {
    if (expenses.length === 0) {
      toast.error('No expenses to export');
      return;
    }

    exportToJSON(expenses, `expenses-${format(new Date(), 'yyyy-MM-dd')}.json`);
    toast.success('Expenses exported to JSON');
  }, []);

  return {
    exportToCSV: exportExpensesToCSV,
    exportToPDF,
    exportToJSON: exportExpensesToJSON,
    isDownloading,
  };
};
