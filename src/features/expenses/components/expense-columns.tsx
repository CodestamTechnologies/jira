'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Eye, Loader2, Trash2, Pencil } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Expense } from '../types';
import type { Project } from '@/features/projects/types';
import { formatAmount } from '../utils/format-amount';
import { getCategoryName, getCategoryColor, getStatusBadgeVariant, getStatusName } from '../utils/expense-helpers';
import { ExpenseStatus } from '../types';

interface ExpenseWithProject extends Expense {
  projectName?: string;
}

interface CreateExpenseColumnsProps {
  projectMap: Map<string, string>;
  onView?: (expense: Expense) => void;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
  deletingExpenseId?: string | null;
}

/**
 * Creates column definitions for expenses table
 * Includes sorting, formatting, and action buttons
 */
export const createExpenseColumns = ({
  projectMap,
  onView,
  onEdit,
  onDelete,
  deletingExpenseId = null,
}: CreateExpenseColumnsProps): ColumnDef<ExpenseWithProject>[] => [
  {
    accessorKey: 'date',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="h-8 px-2 lg:px-4">
          Date
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.original.date;
      return date ? <p className="text-xs sm:text-sm">{format(new Date(date), 'MMM dd, yyyy')}</p> : <p className="text-muted-foreground">N/A</p>;
    },
  },
  {
    accessorKey: 'description',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="h-8 px-2 lg:px-4">
          Description
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const description = row.original.description;
      return <p className="text-xs sm:text-sm line-clamp-2">{description}</p>;
    },
  },
  {
    accessorKey: 'category',
    header: () => <span className="h-8 px-2 lg:px-4 flex items-center">Category</span>,
    cell: ({ row }) => {
      const category = row.original.category;
      const customCategory = row.original.customCategory;
      const categoryName = getCategoryName(category, customCategory);
      const categoryColor = getCategoryColor(category);
      return (
        <Badge variant="outline" className={categoryColor}>
          {categoryName}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="h-8 px-2 lg:px-4">
          Amount
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = row.original.amount;
      return <p className="text-xs sm:text-sm font-semibold text-primary">{formatAmount(amount)}</p>;
    },
  },
  {
    accessorKey: 'projectId',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="h-8 px-2 lg:px-4">
          <span className="hidden sm:inline">Project</span>
          <span className="sm:hidden">Proj</span>
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const projectName = row.original.projectName || projectMap.get(row.original.projectId || '') || 'Workspace';
      return <p className="text-xs sm:text-sm line-clamp-1">{projectName}</p>;
    },
  },
  {
    accessorKey: 'status',
    header: () => <span className="h-8 px-2 lg:px-4 flex items-center">Status</span>,
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={getStatusBadgeVariant(status)}>
          {getStatusName(status)}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    header: () => <span className="h-8 px-2 lg:px-4 flex items-center">Actions</span>,
    cell: ({ row }) => {
      const expense = row.original;
      const isCurrentlyDeleting = deletingExpenseId === expense.$id;

      return (
        <div className="flex items-center gap-2">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(expense)}
              className="h-8 px-2"
              title="View expense details"
            >
              <Eye className="h-3 w-3" />
              <span className="hidden sm:inline ml-1">View</span>
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(expense)}
              className="h-8 px-2"
              title="Edit expense"
            >
              <Pencil className="h-3 w-3" />
              <span className="hidden sm:inline ml-1">Edit</span>
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(expense)}
              disabled={isCurrentlyDeleting}
              className="h-8 px-2 text-destructive hover:text-destructive"
              title="Delete expense"
            >
              {isCurrentlyDeleting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              <span className="hidden sm:inline ml-1">Delete</span>
            </Button>
          )}
        </div>
      );
    },
  },
];




