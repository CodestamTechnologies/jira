import { useQuery } from '@tanstack/react-query';

import { client } from '@/lib/hono';
import { CACHE_TIMES } from '@/lib/react-query/constants';

/**
 * Hook to fetch a single expense by ID
 * Uses MODERATE cache time (3 minutes) for expense data
 * 
 * @param expenseId - Expense ID
 * @returns React Query hook result
 */
export const useGetExpense = (expenseId: string) => {
  const query = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: async () => {
      const response = await client.api.expenses[':expenseId'].$get({
        param: { expenseId },
      });

      if (!response.ok) throw new Error('Failed to fetch expense.');

      const { data } = await response.json();

      return data;
    },
    staleTime: CACHE_TIMES.MODERATE, // 3 minutes
    enabled: !!expenseId, // Only fetch if expenseId is provided
  });

  return query;
};
