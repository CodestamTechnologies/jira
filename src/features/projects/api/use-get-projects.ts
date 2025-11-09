import { useQuery } from '@tanstack/react-query';

import { client } from '@/lib/hono';

interface useGetProjectsProps {
  workspaceId: string;
  showAll?: boolean; // Deprecated - kept for backward compatibility, always returns all projects
}

export const useGetProjects = ({ workspaceId, showAll }: useGetProjectsProps) => {
  const query = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: async () => {
      const response = await client.api.projects.$get({
        query: { workspaceId },
      });

      if (!response.ok) throw new Error('Failed to fetch projects.');

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
