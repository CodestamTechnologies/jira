import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { client } from '@/lib/hono';

interface RequestType {
  commentId: string;
  taskId: string;
}

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ commentId, taskId }: RequestType) => {
      const response = await (client.api as any)['tasks/:taskId/comments/:commentId'].$delete({
        param: { taskId, commentId },
      });
      if (!response.ok) throw new Error('Failed to delete comment.');
      return await response.json();
    },
    onSuccess: (_data, variables) => {
      toast.success('Comment deleted.');
      queryClient.invalidateQueries({
        queryKey: ['comments', variables.taskId],
      });
    },
    onError: (error) => {
      console.error('[DELETE_COMMENT]: ', error);
      toast.error('Failed to delete comment.');
    },
  });

  return mutation;
};
