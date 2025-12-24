import { client } from '@/lib/hono';
import { createMutation } from '@/lib/react-query/mutation-factory';
import { invalidateCommentQueries } from '@/lib/react-query/cache-utils';

interface RequestType {
  commentId: string;
  taskId: string;
}

/**
 * Hook to delete a comment from a task
 * 
 * Uses the mutation factory for consistent error handling and cache invalidation.
 * Automatically invalidates comment queries for the task.
 * 
 * @example
 * ```tsx
 * const deleteComment = useDeleteComment();
 * deleteComment.mutate({
 *   commentId: 'comment-123',
 *   taskId: 'task-123'
 * });
 * ```
 */
export const useDeleteComment = createMutation<unknown, Error, RequestType>({
  mutationFn: async ({ commentId, taskId }) => {
    const response = await (client.api as any)['tasks/:taskId/comments/:commentId'].$delete({
      param: { taskId, commentId },
    });
    if (!response.ok) throw new Error('Failed to delete comment.');
    return await response.json();
  },
  successMessage: 'Comment deleted.',
  logPrefix: '[DELETE_COMMENT]',
  onSuccessInvalidate: (queryClient, _data, variables) => {
    // Use centralized cache invalidation utility
    invalidateCommentQueries(queryClient, variables.taskId);
  },
});
