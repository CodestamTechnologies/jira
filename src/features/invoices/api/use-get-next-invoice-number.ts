import { useQuery } from '@tanstack/react-query';

import { client } from '@/lib/hono';

export const useGetNextInvoiceNumber = () => {
  const query = useQuery({
    queryKey: ['invoices', 'next-number'],
    queryFn: async () => {
      const response = await client.api.invoices['next-number'].$get();

      if (!response.ok) throw new Error('Failed to fetch next invoice number.');

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
