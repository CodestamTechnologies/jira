import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/hono';

interface RequestType {
  taskId: string;
  content: string;
  authorId: string;
  username: string;
}

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ taskId, content, authorId, username }: RequestType) => {
      const response = await (client.api as any)['tasks/:taskId/comments'].$post({
        param: { taskId },
        json: { content, authorId, username },
      });
      if (!response.ok) throw new Error('Failed to add comment.');
      return await response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['comments', variables.taskId],
      });
    },
    onError: (error) => {
      console.error('[CREATE_COMMENT]: ', error);
    },
  });

  return mutation;
}; 
