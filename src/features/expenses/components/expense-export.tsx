'use client';

import { useState, useMemo } from 'react';
import { Download, FileText, FileSpreadsheet, FileJson, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDownloadExpenses } from '../hooks/use-download-expenses';
import type { Expense } from '../types';
import type { Project } from '@/features/projects/types';

interface ExpenseExportProps {
  expenses: Expense[];
  projectMap?: Map<string, Project>;
}

/**
 * Expense export component
 * Provides dropdown menu for exporting expenses in different formats
 */
export const ExpenseExport = ({ expenses, projectMap }: ExpenseExportProps) => {
  const { exportToCSV, exportToPDF, exportToJSON, isDownloading } = useDownloadExpenses();

  // Convert project map to string map for PDF component
  // Memoized to prevent unnecessary recalculations
  const projectNameMap = useMemo(
    () =>
      projectMap
        ? new Map(Array.from(projectMap.entries()).map(([id, project]) => [id, project.name]))
        : undefined,
    [projectMap],
  );

  const handleExport = (format: 'csv' | 'pdf' | 'json') => {
    if (expenses.length === 0) {
      return;
    }

    switch (format) {
      case 'csv':
        exportToCSV({ expenses, projectMap: projectNameMap });
        break;
      case 'pdf':
        exportToPDF({ expenses, projectMap: projectNameMap });
        break;
      case 'json':
        exportToJSON({ expenses });
        break;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isDownloading || expenses.length === 0}>
          {isDownloading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('pdf')} disabled={isDownloading}>
          <FileText className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')} disabled={isDownloading}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')} disabled={isDownloading}>
          <FileJson className="mr-2 h-4 w-4" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
