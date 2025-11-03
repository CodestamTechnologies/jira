'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import type { Invoice } from '@/features/invoices/types';
import type { Project } from '@/features/projects/types';

interface InvoiceWithProject extends Invoice {
  projectName?: string;
}

interface CreateInvoiceColumnsProps {
  projectMap: Map<string, string>;
  projectsMap: Map<string, Project>;
  onDownload: (invoice: Invoice, project: Project | null) => void;
  isDownloading?: boolean;
}

export const createInvoiceColumns = ({
  projectMap,
  projectsMap,
  onDownload,
  isDownloading = false,
}: CreateInvoiceColumnsProps): ColumnDef<InvoiceWithProject>[] => [
    {
      accessorKey: 'invoiceNumber',
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="h-8 px-2 lg:px-4">
            <span className="hidden sm:inline">Invoice Number</span>
            <span className="sm:hidden">Invoice #</span>
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const invoiceNumber = row.original.invoiceNumber;
        return <p className="font-mono text-xs sm:text-sm">{invoiceNumber}</p>;
      },
    },
    {
      accessorKey: '$createdAt',
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="h-8 px-2 lg:px-4">
            Date
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.original.$createdAt;
        return date ? <p className="text-xs sm:text-sm">{format(new Date(date), 'MMM dd, yyyy')}</p> : <p className="text-muted-foreground">N/A</p>;
      },
    },
    {
      accessorKey: 'projectId',
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="h-8 px-2 lg:px-4">
            <span className="hidden sm:inline">Client (Project)</span>
            <span className="sm:hidden">Client</span>
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const projectName = row.original.projectName || projectMap.get(row.original.projectId) || 'Unknown Project';
        return <p className="text-xs sm:text-sm line-clamp-1">{projectName}</p>;
      },
    },
    {
      accessorKey: 'items',
      header: () => <span className="h-8 px-2 lg:px-4 flex items-center">Items</span>,
      cell: ({ row }) => {
        const items = Array.isArray(row.original.items) ? row.original.items : [];
        return <p className="text-xs sm:text-sm">{items.length}</p>;
      },
    },
    {
      accessorKey: 'subtotal',
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="h-8 px-2 lg:px-4">
            Subtotal
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const subtotal = row.original.subtotal;
        return <p className="text-xs sm:text-sm font-medium">₹{subtotal.toFixed(2)}</p>;
      },
    },
    {
      accessorKey: 'total',
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="h-8 px-2 lg:px-4">
            Total
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const total = row.original.total;
        return <p className="text-xs sm:text-sm font-semibold text-primary">₹{total.toFixed(2)}</p>;
      },
    },
    {
      id: 'actions',
      header: () => <span className="h-8 px-2 lg:px-4 flex items-center">Actions</span>,
      cell: ({ row }) => {
        const invoice = row.original;
        const project = projectsMap.get(invoice.projectId) || null;
        const isCurrentlyDownloading = isDownloading;

        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDownload(invoice, project)}
            disabled={isCurrentlyDownloading || !project}
            className="h-8 px-2"
            title={!project ? 'Project information not available' : 'Download invoice PDF'}
          >
            {isCurrentlyDownloading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
            <span className="hidden sm:inline ml-1">Download</span>
          </Button>
        );
      },
    },
  ];
