import { useQuery } from '@tanstack/react-query';

import { client } from '@/lib/hono';

interface UseGetLeadProps {
  leadId: string;
}

export const useGetLead = ({ leadId }: UseGetLeadProps) => {
  const query = useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      const response = await client.api.leads[':leadId'].$get({
        param: { leadId },
      });

      if (!response.ok) throw new Error('Failed to fetch lead.');

      const { data } = await response.json();

      return data;
    },
    enabled: !!leadId,
  });

  return query;
};
