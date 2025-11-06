import { useQuery } from '@tanstack/react-query';

import { client } from '@/lib/hono';

interface UseGetMembersProps {
  workspaceId: string;
  includeInactive?: string; // 'true' to include inactive members
}

export const useGetMembers = ({ workspaceId, includeInactive }: UseGetMembersProps) => {
  const query = useQuery({
    queryKey: ['members', workspaceId, includeInactive],
    queryFn: async () => {
      const response = await client.api.members.$get({ 
        query: { 
          workspaceId,
          ...(includeInactive && { includeInactive }),
        } 
      });

      if (!response.ok) throw new Error('Failed to fetch members.');

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
