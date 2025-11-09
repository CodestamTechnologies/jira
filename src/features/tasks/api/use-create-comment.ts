import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { client } from '@/lib/hono';

interface RequestType {
  taskId: string;
  content: string;
  authorId: string;
  username: string;
  parentId?: string;
  mentions?: string[];
  attachments?: Array<{
    fileId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }>;
}

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ taskId, content, authorId, username, parentId, mentions, attachments }: RequestType) => {
      const response = await (client.api as any)['tasks/:taskId/comments'].$post({
        param: { taskId },
        json: { content, authorId, username, parentId, mentions, attachments },
      });
      if (!response.ok) throw new Error('Failed to add comment.');
      return await response.json();
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.parentId ? 'Reply added.' : 'Comment added.');
      queryClient.invalidateQueries({
        queryKey: ['comments', variables.taskId],
      });
    },
    onError: (error) => {
      console.error('[CREATE_COMMENT]: ', error);
      toast.error('Failed to add comment.');
    },
  });

  return mutation;
}; 
