import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/hono';

interface useGetCommentsProps {
  taskId: string;
}

export const useGetComments = ({ taskId }: useGetCommentsProps) => {
  const query = useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      const response = await (client.api as any)['tasks/:taskId/comments'].$get({
        param: { taskId },
      });
      if (!response.ok) throw new Error('Failed to fetch comments.');
      const { data } = await response.json();
      return data;
    },
  });
  return query;
}; 
