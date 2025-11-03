'use client';

import { useMemo, useCallback } from 'react';
import { Loader2, FileText } from 'lucide-react';

import { DataTable } from '@/features/tasks/components/data-table';
import { Card, CardContent } from '@/components/ui/card';
import { useGetInvoices } from '@/features/invoices/api/use-get-invoices';
import { useGetProjects } from '@/features/projects/api/use-get-projects';
import { createInvoiceColumns } from '@/features/invoices/components/invoice-columns';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useDownloadInvoice } from '@/features/invoices/hooks/use-download-invoice';
import { toast } from 'sonner';
import type { Invoice } from '@/features/invoices/types';
import type { Project } from '@/features/projects/types';

interface InvoiceTableProps {
  projectId?: string;
}

interface InvoiceWithProject extends Invoice {
  projectName?: string;
}

export const InvoiceTable = ({ projectId }: InvoiceTableProps) => {
  const workspaceId = useWorkspaceId();
  const { data: invoicesData, isLoading: isLoadingInvoices } = useGetInvoices({ workspaceId, projectId });
  const { data: projectsData } = useGetProjects({ workspaceId });
  const { downloadInvoice, isDownloading } = useDownloadInvoice();

  // Create a map of project IDs to project names for quick lookup
  const projectMap = useMemo(() => {
    if (!projectsData?.documents) return new Map();
    return new Map(projectsData.documents.map((project) => [project.$id, project.name]));
  }, [projectsData]);

  // Create a map of project IDs to full project objects for downloading
  const projectsMap = useMemo(() => {
    if (!projectsData?.documents) return new Map();
    return new Map(projectsData.documents.map((project) => [project.$id, project]));
  }, [projectsData]);

  const invoices = invoicesData?.documents || [];
  const isLoading = isLoadingInvoices;

  // Enrich invoices with project names
  const invoicesWithProjects: InvoiceWithProject[] = useMemo(() => {
    return invoices.map((invoice) => ({
      ...invoice,
      projectName: projectMap.get(invoice.projectId),
    }));
  }, [invoices, projectMap]);

  const handleDownload = useCallback(
    async (invoice: Invoice, project: Project | null) => {
      try {
        await downloadInvoice({ invoice, project });
        toast.success('Invoice downloaded successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to download invoice. Please try again.';
        toast.error(errorMessage);
      }
    },
    [downloadInvoice],
  );

  const columns = useMemo(
    () =>
      createInvoiceColumns({
        projectMap,
        projectsMap,
        onDownload: handleDownload,
        isDownloading,
      }),
    [projectMap, projectsMap, handleDownload, isDownloading],
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

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="size-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground text-center">
            No invoices found. Create your first invoice to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <DataTable columns={columns} data={invoicesWithProjects} />;
};
