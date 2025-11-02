import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InferRequestType, InferResponseType } from 'hono';
import { toast } from 'sonner';

import { client } from '@/lib/hono';
import type { Invoice } from '@/features/invoices/types';

type ResponseType = InferResponseType<(typeof client.api.invoices)['$post'], 200>;
type RequestType = InferRequestType<(typeof client.api.invoices)['$post']>;

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.invoices['$post']({ json });

      if (!response.ok) throw new Error('Failed to create invoice.');

      return await response.json();
    },
    onSuccess: (response) => {
      toast.success('Invoice created and saved.');

      // Type assertion: response.data contains the invoice
      const invoice = response.data as Invoice;

      queryClient.invalidateQueries({
        queryKey: ['invoices', invoice.workspaceId],
      });
    },
    onError: (error) => {
      console.error('[CREATE_INVOICE]: ', error);

      toast.error('Failed to create invoice.');
    },
  });

  return mutation;
};
