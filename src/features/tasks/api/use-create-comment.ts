import { client } from '@/lib/hono';
import { createMutation } from '@/lib/react-query/mutation-factory';
import { invalidateCommentQueries } from '@/lib/react-query/cache-utils';

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

/**
 * Hook to create a comment on a task
 * 
 * Uses the mutation factory for consistent error handling and cache invalidation.
 * Automatically invalidates comment queries for the task.
 * 
 * @example
 * ```tsx
 * const createComment = useCreateComment();
 * createComment.mutate({
 *   taskId: 'task-123',
 *   content: 'This is a comment',
 *   authorId: 'user-123',
 *   username: 'John Doe'
 * });
 * ```
 */
export const useCreateComment = createMutation<unknown, Error, RequestType>({
  mutationFn: async ({ taskId, content, authorId, username, parentId, mentions, attachments }) => {
    const response = await (client.api as any)['tasks/:taskId/comments'].$post({
      param: { taskId },
      json: { content, authorId, username, parentId, mentions, attachments },
    });
    if (!response.ok) throw new Error('Failed to add comment.');
    return await response.json();
  },
  successMessage: (_, variables) => variables.parentId ? 'Reply added.' : 'Comment added.',
  logPrefix: '[CREATE_COMMENT]',
  onSuccessInvalidate: (queryClient, _data, variables) => {
    // Use centralized cache invalidation utility
    invalidateCommentQueries(queryClient, variables.taskId);
  },
}); 
