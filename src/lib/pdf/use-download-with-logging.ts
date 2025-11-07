'use client';

import { useCallback } from 'react';
import { downloadPDF, generateSafeFilename } from './utils';
import { useLogDownload } from '@/features/activity-logs/api/use-log-download';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';

type DocumentType = 'NDA' | 'JOINING_LETTER' | 'SALARY_SLIP' | 'INVOICE';

interface DownloadWithLoggingOptions {
  documentType: DocumentType;
  blob: Blob;
  filename: string;
  documentName?: string;
  invoiceNumber?: string;
  employeeName?: string;
  month?: string;
  year?: string;
  workspaceId?: string; // Optional, will use hook if not provided
}

/**
 * Custom hook for downloading PDFs with automatic activity logging
 * Provides a clean, reusable interface for document downloads
 */
export const useDownloadWithLogging = () => {
  const defaultWorkspaceId = useWorkspaceId();
  const { mutate: logDownload } = useLogDownload();

  const downloadWithLogging = useCallback(
    async ({
      documentType,
      blob,
      filename,
      documentName,
      invoiceNumber,
      employeeName,
      month,
      year,
      workspaceId,
    }: DownloadWithLoggingOptions) => {
      const targetWorkspaceId = workspaceId || defaultWorkspaceId;

      if (!targetWorkspaceId) {
        console.warn('Workspace ID not available, downloading without logging');
        downloadPDF(blob, filename);
        return;
      }

      // Download the PDF
      downloadPDF(blob, filename);

      // Log the download (fire and forget - don't block on logging)
      logDownload(
        {
          documentType,
          workspaceId: targetWorkspaceId,
          documentName: documentName || filename,
          invoiceNumber,
          employeeName,
          month,
          year,
        },
        {
          onError: (error) => {
            // Silently fail logging - don't interrupt user experience
            console.error('Failed to log download:', error);
          },
        }
      );
    },
    [defaultWorkspaceId, logDownload]
  );

  return { downloadWithLogging };
};
