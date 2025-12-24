import { useQuery } from '@tanstack/react-query';

import { client } from '@/lib/hono';
import { CACHE_TIMES } from '@/lib/react-query/constants';
import type { ExpenseFiltersInput } from '../schema';

/**
 * Hook to fetch expenses with filters
 * Uses MODERATE cache time (3 minutes) for expense data
 * 
 * @param filters - Expense filters (workspaceId, projectId, date range, category, status)
 * @returns React Query hook result
 */
export const useGetExpenses = (filters: ExpenseFiltersInput) => {
  const query = useQuery({
    queryKey: ['expenses', filters.workspaceId, filters.projectId, filters.startDate, filters.endDate, filters.category, filters.status],
    queryFn: async () => {
      const response = await client.api.expenses.$get({
        query: filters,
      });

      if (!response.ok) throw new Error('Failed to fetch expenses.');

      const { data } = await response.json();

      return data;
    },
    staleTime: CACHE_TIMES.MODERATE, // 3 minutes - expenses are moderately stable
  });

  return query;
};
