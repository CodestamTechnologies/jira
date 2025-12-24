import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InferRequestType, InferResponseType } from 'hono';
import { toast } from 'sonner';

import { client } from '@/lib/hono';
import type { Expense } from '../types';

type ResponseType = InferResponseType<(typeof client.api.expenses)['$post'], 200>;
type RequestType = InferRequestType<(typeof client.api.expenses)['$post']>;

/**
 * Hook to create a new expense
 * Handles form data including optional bill file upload
 * 
 * @returns Mutation hook for creating expenses
 */
export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ form }) => {
      const response = await client.api.expenses['$post']({ form });

      if (!response.ok) {
        const error = await response.json() as { error?: string };
        throw new Error(error.error || 'Failed to create expense.');
      }

      return await response.json();
    },
    onSuccess: (response) => {
      toast.success('Expense created successfully.');

      // Type assertion: response.data contains the expense
      const expense = response.data as Expense;

      // Invalidate expenses queries to refetch the list
      queryClient.invalidateQueries({
        queryKey: ['expenses', expense.workspaceId],
      });
    },
    onError: (error) => {
      console.error('[CREATE_EXPENSE]: ', error);

      const errorMessage = error instanceof Error ? error.message : 'Failed to create expense.';
      toast.error(errorMessage);
    },
  });

  return mutation;
};
