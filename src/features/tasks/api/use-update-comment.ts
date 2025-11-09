import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { client } from '@/lib/hono';

interface RequestType {
  commentId: string;
  taskId: string;
  content: string;
  mentions?: string[];
}

export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ commentId, taskId, content, mentions }: RequestType) => {
      const response = await (client.api as any)['tasks/:taskId/comments/:commentId'].$patch({
        param: { taskId, commentId },
        json: { content, mentions },
      });
      if (!response.ok) throw new Error('Failed to update comment.');
      return await response.json();
    },
    onSuccess: (_data, variables) => {
      toast.success('Comment updated.');
      queryClient.invalidateQueries({
        queryKey: ['comments', variables.taskId],
      });
    },
    onError: (error) => {
      console.error('[UPDATE_COMMENT]: ', error);
      toast.error('Failed to update comment.');
    },
  });

  return mutation;
};
