import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InferRequestType, InferResponseType } from 'hono';
import { toast } from 'sonner';

import { client } from '@/lib/hono';
import type { Invoice } from '@/features/invoices/types';

type ResponseType = InferResponseType<(typeof client.api.invoices)[':id']['status']['$patch'], 200>;
type RequestType = InferRequestType<(typeof client.api.invoices)[':id']['status']['$patch']>;

export const useUpdateInvoiceStatus = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param, json }) => {
      const response = await client.api.invoices[':id'].status.$patch({ param, json });

      if (!response.ok) throw new Error('Failed to update invoice status.');

      return await response.json();
    },
    onSuccess: (response) => {
      toast.success('Invoice status updated.');

      const invoice = response.data as Invoice;

      queryClient.invalidateQueries({
        queryKey: ['invoices', invoice.workspaceId],
      });
    },
    onError: (error) => {
      console.error('[UPDATE_INVOICE_STATUS]: ', error);
      toast.error('Failed to update invoice status.');
    },
  });

  return mutation;
};
