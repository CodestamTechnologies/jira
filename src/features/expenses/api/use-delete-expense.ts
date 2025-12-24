import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InferRequestType, InferResponseType } from 'hono';
import { toast } from 'sonner';

import { client } from '@/lib/hono';

type ResponseType = InferResponseType<(typeof client.api.expenses[':expenseId'])['$delete'], 200>;
type RequestType = InferRequestType<(typeof client.api.expenses[':expenseId'])['$delete']>;

/**
 * Hook to delete an expense
 * Also deletes associated bill file
 * 
 * @returns Mutation hook for deleting expenses
 */
export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.expenses[':expenseId']['$delete']({ param });

      if (!response.ok) {
        const error = await response.json() as { error?: string };
        throw new Error(error.error || 'Failed to delete expense.');
      }

      return await response.json();
    },
    onSuccess: (_, variables) => {
      toast.success('Expense deleted successfully.');

      // Invalidate all expenses queries
      // We don't have workspaceId in the response, so invalidate all expense queries
      queryClient.invalidateQueries({
        queryKey: ['expenses'],
      });
      queryClient.invalidateQueries({
        queryKey: ['expense', variables.param.expenseId],
      });
    },
    onError: (error) => {
      console.error('[DELETE_EXPENSE]: ', error);

      const errorMessage = error instanceof Error ? error.message : 'Failed to delete expense.';
      toast.error(errorMessage);
    },
  });

  return mutation;
};
