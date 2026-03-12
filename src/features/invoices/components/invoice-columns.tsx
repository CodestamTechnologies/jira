'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Download, Loader2, Mail } from 'lucide-react';
import { format } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Invoice, InvoiceStatus } from '@/features/invoices/types';
import type { Project } from '@/features/projects/types';

interface InvoiceWithProject extends Invoice {
  projectName?: string;
}

const STATUS_OPTIONS: InvoiceStatus[] = ['paid', 'pending', 'invalid'];

const statusVariant: Record<InvoiceStatus, 'default' | 'secondary' | 'destructive'> = {
  paid: 'default',
  pending: 'secondary',
  invalid: 'destructive',
};

interface CreateInvoiceColumnsProps {
  projectMap: Map<string, string>;
  projectsMap: Map<string, Project>;
  onDownload: (invoice: Invoice, project: Project | null) => void;
  onSend: (invoice: Invoice, project: Project | null) => void;
  onUpdateStatus?: (invoiceId: string, status: InvoiceStatus) => void;
  downloadingInvoiceId?: string | null;
  sendingInvoiceId?: string | null;
  updatingStatusId?: string | null;
}

export const createInvoiceColumns = ({
  projectMap,
  projectsMap,
  onDownload,
  onSend,
  onUpdateStatus,
  downloadingInvoiceId = null,
  sendingInvoiceId = null,
  updatingStatusId = null,
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
      accessorKey: 'status',
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="h-8 px-2 lg:px-4">
            Status
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const invoice = row.original;
        const status = invoice.status ?? 'pending';
        const isUpdating = updatingStatusId === invoice.$id;

        if (onUpdateStatus) {
          return (
            <Select
              value={status}
              onValueChange={(value) => onUpdateStatus(invoice.$id, value as InvoiceStatus)}
              disabled={isUpdating}
            >
              <SelectTrigger className="h-8 w-[110px] border-0 bg-transparent shadow-none focus:ring-0">
                {isUpdating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <SelectValue>
                    <Badge variant={statusVariant[status]} className="capitalize">
                      {status}
                    </Badge>
                  </SelectValue>
                )}
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt} className="capitalize">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }

        return (
          <Badge variant={statusVariant[status]} className="capitalize">
            {status}
          </Badge>
        );
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
        const isCurrentlyDownloading = downloadingInvoiceId === invoice.$id;
        const isCurrentlySending = sendingInvoiceId === invoice.$id;
        const isDisabled = isCurrentlyDownloading || isCurrentlySending || !project;

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload(invoice, project)}
              disabled={isDisabled}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSend(invoice, project)}
              disabled={isDisabled}
              className="h-8 px-2"
              title={!project ? 'Project information not available' : 'Send invoice via email'}
            >
              {isCurrentlySending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Mail className="h-3 w-3" />
              )}
              <span className="hidden sm:inline ml-1">Send</span>
            </Button>
          </div>
        );
      },
    },
  ];
