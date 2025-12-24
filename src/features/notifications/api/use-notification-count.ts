import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/hono';
import { useCurrent } from '@/features/auth/api/use-current';

/**
 * Hook to get unread notification count for current user
 * Automatically refetches every 30 seconds and invalidates on mutations
 */
export const useNotificationCount = () => {
  const { data: user } = useCurrent();

  const query = useQuery({
    queryKey: ['notifications', 'count', user?.$id],
    queryFn: async () => {
      if (!user?.$id) return 0;

      const response = await client.api.notifications.count.$get();

      if (!response.ok) throw new Error('Failed to fetch notification count.');

      const { data } = await response.json();

      return data.count as number;
    },
    enabled: !!user?.$id,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time feel
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  return query;
};


