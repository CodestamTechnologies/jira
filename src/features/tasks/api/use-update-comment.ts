import { client } from '@/lib/hono';
import { createMutation } from '@/lib/react-query/mutation-factory';
import { invalidateCommentQueries } from '@/lib/react-query/cache-utils';

interface RequestType {
  commentId: string;
  taskId: string;
  content: string;
  mentions?: string[];
}

/**
 * Hook to update a comment on a task
 * 
 * Uses the mutation factory for consistent error handling and cache invalidation.
 * Automatically invalidates comment queries for the task.
 * 
 * @example
 * ```tsx
 * const updateComment = useUpdateComment();
 * updateComment.mutate({
 *   commentId: 'comment-123',
 *   taskId: 'task-123',
 *   content: 'Updated comment content'
 * });
 * ```
 */
export const useUpdateComment = createMutation<unknown, Error, RequestType>({
  mutationFn: async ({ commentId, taskId, content, mentions }) => {
    const response = await (client.api as any)['tasks/:taskId/comments/:commentId'].$patch({
      param: { taskId, commentId },
      json: { content, mentions },
    });
    if (!response.ok) throw new Error('Failed to update comment.');
    return await response.json();
  },
  successMessage: 'Comment updated.',
  logPrefix: '[UPDATE_COMMENT]',
  onSuccessInvalidate: (queryClient, _data, variables) => {
    // Use centralized cache invalidation utility
    invalidateCommentQueries(queryClient, variables.taskId);
  },
});
