import { useMutation } from '@tanstack/react-query';

import { client } from '@/lib/hono';

type LogDownloadRequest = {
  documentType: 'NDA' | 'JOINING_LETTER' | 'SALARY_SLIP' | 'INVOICE';
  workspaceId: string;
  documentName?: string;
  invoiceNumber?: string;
  employeeName?: string;
  month?: string;
  year?: string;
};

export const useLogDownload = () => {
  return useMutation({
    mutationFn: async (data: LogDownloadRequest): Promise<void> => {
      const response = await client.api['activity-logs'].download.$post({ json: data });

      if (!response.ok) {
        const error = await response.json() as { error?: string };
        throw new Error(error.error || 'Failed to log download');
      }
    },
  });
};
