import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InferRequestType, InferResponseType } from 'hono';
import { toast } from 'sonner';

import { client } from '@/lib/hono';
import type { Expense } from '../types';

type ResponseType = InferResponseType<(typeof client.api.expenses[':expenseId'])['$patch'], 200>;
type RequestType = InferRequestType<(typeof client.api.expenses[':expenseId'])['$patch']>;

/**
 * Hook to update an existing expense
 * Handles form data including optional bill file replacement
 * 
 * @returns Mutation hook for updating expenses
 */
export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param, form }) => {
      const response = await client.api.expenses[':expenseId']['$patch']({ param, form });

      if (!response.ok) {
        const error = await response.json() as { error?: string };
        throw new Error(error.error || 'Failed to update expense.');
      }

      return await response.json();
    },
    onSuccess: (response) => {
      toast.success('Expense updated successfully.');

      // Type assertion: response.data contains the expense
      const expense = response.data as Expense;

      // Invalidate expenses queries to refetch the list
      queryClient.invalidateQueries({
        queryKey: ['expenses', expense.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ['expense', expense.$id],
      });
    },
    onError: (error) => {
      console.error('[UPDATE_EXPENSE]: ', error);

      const errorMessage = error instanceof Error ? error.message : 'Failed to update expense.';
      toast.error(errorMessage);
    },
  });

  return mutation;
};
