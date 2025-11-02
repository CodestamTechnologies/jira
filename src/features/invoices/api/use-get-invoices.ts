import { useQuery } from '@tanstack/react-query';

import { client } from '@/lib/hono';

interface useGetInvoicesProps {
  workspaceId: string;
  projectId?: string;
}

export const useGetInvoices = ({ workspaceId, projectId }: useGetInvoicesProps) => {
  const query = useQuery({
    queryKey: ['invoices', workspaceId, projectId],
    queryFn: async () => {
      const response = await client.api.invoices.$get({
        query: {
          workspaceId,
          ...(projectId && { projectId }),
        },
      });

      if (!response.ok) throw new Error('Failed to fetch invoices.');

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
