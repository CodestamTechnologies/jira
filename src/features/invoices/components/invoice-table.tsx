'use client';

import { useState, useMemo, useCallback } from 'react';
import { Loader2, FileText } from 'lucide-react';

import { DataTable } from '@/features/tasks/components/data-table';
import { Card, CardContent } from '@/components/ui/card';
import { useGetInvoices } from '@/features/invoices/api/use-get-invoices';
import { useGetProjects } from '@/features/projects/api/use-get-projects';
import { createInvoiceColumns } from '@/features/invoices/components/invoice-columns';
import { SendInvoiceDialog } from '@/features/invoices/components/send-invoice-dialog';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useDownloadInvoice } from '@/features/invoices/hooks/use-download-invoice';
import { useSendInvoice } from '@/features/invoices/api/use-send-invoice';
import { pdfBlobToBase64 } from '@/lib/pdf/utils';
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
  const { downloadInvoice, generateInvoicePDF } = useDownloadInvoice();
  const { mutate: sendInvoice, isPending: isSending } = useSendInvoice();
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<{ invoice: Invoice; project: Project | null } | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);

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
      setDownloadingInvoiceId(invoice.$id);
      try {
        await downloadInvoice({ invoice, project });
        toast.success('Invoice downloaded successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to download invoice. Please try again.';
        toast.error(errorMessage);
      } finally {
        setDownloadingInvoiceId(null);
      }
    },
    [downloadInvoice],
  );

  const handleSendClick = useCallback(
    (invoice: Invoice, project: Project | null) => {
      if (!project) {
        toast.error('Project information not available');
        return;
      }
      setSelectedInvoice({ invoice, project });
      setSendDialogOpen(true);
    },
    [],
  );

  const handleSendInvoice = useCallback(
    async (email: string) => {
      if (!selectedInvoice) return;

      const { invoice, project } = selectedInvoice;

      if (!project) {
        toast.error('Project information not available');
        return;
      }

      setSendingInvoiceId(invoice.$id);
      try {
        // Generate PDF
        const { pdfBlob, invoiceData } = await generateInvoicePDF({ invoice, project });

        // Convert to base64
        const pdfBase64 = await pdfBlobToBase64(pdfBlob);

        // Send invoice
        sendInvoice(
          {
            invoiceNumber: invoice.invoiceNumber,
            clientName: project.name,
            clientEmail: email,
            pdfBase64,
          },
          {
            onSuccess: () => {
              toast.success('Invoice sent successfully');
              setSendDialogOpen(false);
              setSelectedInvoice(null);
              setSendingInvoiceId(null);
            },
            onError: (error) => {
              const errorMessage = error instanceof Error ? error.message : 'Failed to send invoice. Please try again.';
              toast.error(errorMessage);
              setSendingInvoiceId(null);
            },
          },
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate invoice. Please try again.';
        toast.error(errorMessage);
        setSendingInvoiceId(null);
      }
    },
    [selectedInvoice, generateInvoicePDF, sendInvoice],
  );

  const columns = useMemo(
    () =>
      createInvoiceColumns({
        projectMap,
        projectsMap,
        onDownload: handleDownload,
        onSend: handleSendClick,
        downloadingInvoiceId,
        sendingInvoiceId,
      }),
    [projectMap, projectsMap, handleDownload, handleSendClick, downloadingInvoiceId, sendingInvoiceId],
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

  return (
    <>
      <DataTable columns={columns} data={invoicesWithProjects} />
      {selectedInvoice && (
        <SendInvoiceDialog
          open={sendDialogOpen}
          onOpenChange={setSendDialogOpen}
          onSend={handleSendInvoice}
          isSending={isSending}
          invoiceNumber={selectedInvoice.invoice.invoiceNumber}
          defaultEmail={selectedInvoice.project?.clientEmail || ''}
        />
      )}
    </>
  );
};
